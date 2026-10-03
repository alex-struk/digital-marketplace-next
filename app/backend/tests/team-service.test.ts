import { beforeEach, describe, expect, it, vi } from "vitest";
import { refusalFor } from "../src/common/refusals";
import { Envelope } from "../src/mail/message";
import { Mailer } from "../src/mail/mailer";
import { render } from "../src/mail/render";
import { StoredOrganization } from "../src/organizations/organization";
import { OrganizationsService, Requester } from "../src/organizations/organizations.service";
import { TeamService } from "../src/organizations/team.service";
import { OrganizationViewer } from "../src/rules/organizations";
import { OrganizationsInMemory, person } from "./organizations-in-memory";

/**
 * The team, as the service keeps it: inviting, reading, accepting and declining, leaving and
 * removal, administrator rights, ownership and the changelog, and the messages each step sends.
 */

const ORIGIN = "http://localhost:4300";
const profile = {
  legalName: "Northwind Digital Co-operative",
  streetAddress1: "100 Example Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V0V 0V0",
  country: "Canada",
  contactName: "Owner Person",
  contactEmail: "owner@example.test",
};

const vendor = (id: string): OrganizationViewer & Requester => ({ id, type: "VENDOR", acceptedTermsAt: "2026-01-01T00:00:00.000Z" });
const administrator: OrganizationViewer = { id: "admin", type: "ADMIN" };
const staff: OrganizationViewer = { id: "staff", type: "GOV" };

let store: OrganizationsInMemory;
let sent: Envelope[];
let organizations: OrganizationsService;
let team: TeamService;

beforeEach(() => {
  store = new OrganizationsInMemory();
  sent = [];
  const mailer = { send: vi.fn((envelope: Envelope) => sent.push(envelope)) } as unknown as Mailer;
  const look = { serviceOrigin: ORIGIN, contactEmail: "help@example.test" };
  organizations = new OrganizationsService(store, { mayRead: async () => true }, mailer, look);
  team = new TeamService(store, mailer, look);
});

/** An organization with an owner, an organization administrator, an ordinary member and a pending invitee. */
async function northwind(): Promise<StoredOrganization> {
  const created = await organizations.create(vendor("owner"), profile);
  return store.withMembers(created.id, [
    person("orgAdmin", "ADMIN"),
    person("member", "MEMBER"),
    person("invited", "MEMBER", "PENDING"),
  ]);
}

const membershipOf = (organization: StoredOrganization, userId: string) =>
  store.rows.find((row) => row.id === organization.id)?.members.find(
    (member) => member.userId === userId && member.membershipStatus !== "INACTIVE",
  );

const affiliationOf = (organization: StoredOrganization, userId: string) => membershipOf(organization, userId)?.affiliationId as string;

const refused = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => refusalFor(error));

describe("inviting (R-3.7, R-3.8, R-3.17, R-3.30)", () => {
  it("makes each invitation a pending membership that does not count towards the team", async () => {
    const organization = await organizations.create(vendor("owner"), profile);
    for (const email of ["member@example.test", "Outsider@Example.test"]) {
      const invitation = await team.invite(vendor("owner"), { organization: organization.id, userEmail: email, membershipType: "MEMBER" });
      expect(invitation).toMatchObject({ membershipType: "MEMBER", membershipStatus: "PENDING", organization: { id: organization.id } });
    }
    const listed = await team.team(vendor("owner"), organization.id);
    expect(listed.map((entry) => [entry.user.id, entry.membershipStatus])).toEqual([
      ["owner", "ACTIVE"],
      ["outsider", "PENDING"],
      ["member", "PENDING"],
    ]);
    expect((await organizations.read(vendor("owner"), organization.id)).numTeamMembers).toBe(1);
  });

  it("is open to the owner, the organization's administrators and a service administrator, not to a member", async () => {
    const organization = await northwind();
    const ask = (who: OrganizationViewer | null, email: string) =>
      team.invite(who as never, { organization: organization.id, userEmail: email, membershipType: "MEMBER" });
    await expect(ask(vendor("orgAdmin"), "outsider@example.test")).resolves.toMatchObject({ membershipStatus: "PENDING" });
    await expect(refused(ask(vendor("member"), "gone@example.test"))).resolves.toMatchObject({ status: 401 });
    await expect(refused(ask(staff, "gone@example.test"))).resolves.toMatchObject({ status: 401 });
    await expect(refused(ask(null, "gone@example.test"))).resolves.toMatchObject({ status: 401 });
  });

  it("emails the invited person a way to accept and a way to decline, without offering to unsubscribe (R-3.35, R-6.16)", async () => {
    const organization = await northwind();
    const invitation = await team.invite(administrator, { organization: organization.id, userEmail: "outsider@example.test", membershipType: "OWNER" });
    expect(invitation.membershipType).toBe("OWNER");
    expect(sent).toHaveLength(1);
    const envelope = sent[0] as Envelope;
    expect(envelope.to).toEqual(["outsider@example.test"]);
    const mail = render(envelope.message, { testEnvironment: false, serviceOrigin: ORIGIN } as never);
    expect(mail.subject).toContain("Northwind Digital Co-operative");
    expect(mail.text).toContain(`${ORIGIN}/users/me?tab=organizations&invitation=${invitation.id}&answer=accept`);
    expect(mail.text).toContain(`${ORIGIN}/users/me?tab=organizations&invitation=${invitation.id}&answer=decline`);
    expect(mail.text).not.toMatch(/unsubscribe/i);
    expect(mail.text).toContain(`${ORIGIN}/users/me?tab=notifications`);
  });

  it("refuses a second invitation of somebody already on the team, public sector staff and an inactive vendor", async () => {
    const organization = await northwind();
    const ask = (email: string) => refused(team.invite(vendor("owner"), { organization: organization.id, userEmail: email, membershipType: "MEMBER" }));
    await expect(ask("invited@example.test")).resolves.toEqual({ status: 400, body: { userEmail: ["This person is already a member of the organization."] } });
    await expect(ask("member@example.test")).resolves.toEqual({ status: 400, body: { userEmail: ["This person is already a member of the organization."] } });
    await expect(ask("staff@example.test")).resolves.toEqual({ status: 400, body: { userEmail: ["Only people with a vendor account can be invited."] } });
    await expect(ask("gone@example.test")).resolves.toMatchObject({ status: 400 });
    expect(sent).toHaveLength(0);
  });

  it("lets somebody whose membership ended be invited again", async () => {
    const organization = await northwind();
    await team.end(vendor("member"), affiliationOf(organization, "member"));
    await expect(
      team.invite(vendor("owner"), { organization: organization.id, userEmail: "member@example.test", membershipType: "MEMBER" }),
    ).resolves.toMatchObject({ membershipStatus: "PENDING" });
  });

  it("refuses any membership type but member or owner, and creates nothing", async () => {
    const organization = await northwind();
    for (const membershipType of ["ADMIN", "BOSS", undefined]) {
      await expect(
        refused(team.invite(vendor("owner"), { organization: organization.id, userEmail: "outsider@example.test", membershipType })),
      ).resolves.toEqual({
        status: 400,
        body: { membershipType: ["Invalid membership type: an invitation can only be for a member or an owner."] },
      });
    }
    expect(membershipOf(organization, "outsider")).toBeUndefined();
    expect(sent).toHaveLength(0);
  });

  it("invites an address nobody registered uses to sign up, makes no membership, and tells the inviter", async () => {
    const organization = await northwind();
    const answer = await refused(
      team.invite(vendor("owner"), { organization: organization.id, userEmail: "newperson@example.test", membershipType: "MEMBER" }),
    );
    expect(answer).toMatchObject({ status: 400, body: { inviteeNotRegistered: [expect.stringContaining("not registered")] } });
    expect((await team.team(vendor("owner"), organization.id)).map((entry) => entry.user.id)).not.toContain("newperson");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["newperson@example.test"]);
    expect(sent[0]?.message.body).toContainEqual({ kind: "action", label: "Sign up", href: `${ORIGIN}/sign-up` });
  });

  it("refuses inviting to an archived organization", async () => {
    const organization = await northwind();
    await organizations.archive(vendor("owner"), organization.id);
    await expect(
      refused(team.invite(vendor("owner"), { organization: organization.id, userEmail: "outsider@example.test", membershipType: "MEMBER" })),
    ).resolves.toMatchObject({ status: 400 });
  });
});

describe("reading the team (R-3.14)", () => {
  it("answers the owner, an organization administrator and a service administrator, and refuses a member and an outsider", async () => {
    const organization = await northwind();
    for (const who of [vendor("owner"), vendor("orgAdmin"), administrator]) {
      expect((await team.team(who, organization.id)).map((entry) => entry.user.id)).toEqual(["owner", "invited", "orgAdmin", "member"]);
    }
    for (const who of [vendor("member"), vendor("outsider"), staff, null]) {
      await expect(refused(team.team(who, organization.id))).resolves.toMatchObject({ status: 401 });
    }
  });

  it("does not list an ended membership", async () => {
    const organization = await northwind();
    await team.end(vendor("owner"), affiliationOf(organization, "member"));
    expect((await team.team(vendor("owner"), organization.id)).map((entry) => entry.user.id)).not.toContain("member");
  });
});

describe("accepting and declining an invitation (R-3.9, R-3.31, R-3.32)", () => {
  it("refuses the owner accepting on the person's behalf, accepts the person's own, and then refuses it as not pending", async () => {
    const organization = await northwind();
    const invitation = affiliationOf(organization, "invited");
    await expect(refused(team.change(vendor("owner"), invitation, "approve", undefined))).resolves.toEqual({
      status: 401,
      body: { permissions: ["Only the invited person may accept this membership."] },
    });
    await expect(team.change(vendor("invited"), invitation, "approve", undefined)).resolves.toMatchObject({ membershipStatus: "ACTIVE" });
    await expect(refused(team.change(vendor("invited"), invitation, "approve", undefined))).resolves.toEqual({
      status: 400,
      body: { errors: ["Membership is not pending."] },
    });
    expect((await organizations.read(vendor("owner"), organization.id)).numTeamMembers).toBe(4);
  });

  it("tells the owner the person approved the request, and the person they have joined", async () => {
    const organization = await northwind();
    await team.change(vendor("invited"), affiliationOf(organization, "invited"), "approve", undefined);
    expect(sent.map((envelope) => [envelope.to, envelope.message.kind])).toEqual([
      [["owner@example.test"], "team-invitation-accepted-owner"],
      [["invited@example.test"], "team-invitation-accepted-member"],
    ]);
    expect(sent[0]?.message.body[0]).toMatchObject({ content: [expect.stringContaining("Invited Person has approved")] });
    expect(sent[1]?.message.body[0]).toMatchObject({ content: [expect.stringContaining("put forward on its proposals")] });
  });

  it("lets a service administrator approve on the person's behalf", async () => {
    const organization = await northwind();
    await expect(team.change(administrator, affiliationOf(organization, "invited"), "approve", undefined)).resolves.toMatchObject({
      membershipStatus: "ACTIVE",
    });
  });

  it("takes a declined invitation off the team and tells the owner the request was rejected", async () => {
    const organization = await northwind();
    const declined = await team.end(vendor("invited"), affiliationOf(organization, "invited"));
    expect(declined.membershipStatus).toBe("INACTIVE");
    expect((await team.team(vendor("owner"), organization.id)).map((entry) => entry.user.id)).not.toContain("invited");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["owner@example.test"]);
    expect(sent[0]?.message.subject).toBe("Invited Person rejected the request to join Northwind Digital Co-operative");
  });

  it("emails nobody when the owner withdraws an invitation or a member leaves", async () => {
    const organization = await northwind();
    await team.end(vendor("owner"), affiliationOf(organization, "invited"));
    await team.end(vendor("member"), affiliationOf(organization, "member"));
    expect(sent).toHaveLength(0);
  });
});

describe("leaving and removal (R-3.6, R-3.10, R-3.11)", () => {
  it("ends a member's own membership, so the team shrinks and the organization leaves their list", async () => {
    const organization = await northwind();
    await team.end(vendor("member"), affiliationOf(organization, "member"));
    expect((await organizations.read(vendor("owner"), organization.id)).numTeamMembers).toBe(2);
    expect(await organizations.ownMemberships(vendor("member"))).toEqual([]);
    // Kept, not erased.
    expect(store.rows[0]?.members.find((member) => member.userId === "member")?.membershipStatus).toBe("INACTIVE");
  });

  it("lets the owner, an organization administrator and a service administrator remove somebody, and nobody else", async () => {
    const organization = await northwind();
    await expect(refused(team.end(vendor("member"), affiliationOf(organization, "orgAdmin")))).resolves.toMatchObject({ status: 401 });
    await expect(refused(team.end(vendor("outsider"), affiliationOf(organization, "member")))).resolves.toMatchObject({ status: 401 });
    await expect(team.end(vendor("orgAdmin"), affiliationOf(organization, "member"))).resolves.toMatchObject({ membershipStatus: "INACTIVE" });
    await expect(team.end(administrator, affiliationOf(organization, "orgAdmin"))).resolves.toMatchObject({ membershipStatus: "INACTIVE" });
  });

  it("refuses removing the sole owner, saying so, and keeps the membership", async () => {
    const organization = await northwind();
    const owner = affiliationOf(organization, "owner");
    for (const who of [administrator, vendor("owner"), vendor("orgAdmin")]) {
      await expect(refused(team.end(who, owner))).resolves.toEqual({
        status: 400,
        body: { errors: ["This is the sole owner for the organization, and cannot be removed."] },
      });
    }
    expect(membershipOf(organization, "owner")?.membershipStatus).toBe("ACTIVE");
  });

  it("removes nobody from a membership that does not exist", async () => {
    await expect(refused(team.end(administrator, "00000000-0000-4000-8000-00000000ffff"))).resolves.toMatchObject({ status: 404 });
    await expect(refused(team.end(vendor("owner"), "00000000-0000-4000-8000-00000000ffff"))).resolves.toMatchObject({ status: 401 });
  });
});

describe("administrator rights and the changelog (R-3.12, R-3.33)", () => {
  it("lets the owner give a member rights, and refuses changing one's own and the owner's", async () => {
    const organization = await northwind();
    await expect(team.change(vendor("owner"), affiliationOf(organization, "member"), "updateAdminStatus", true)).resolves.toMatchObject({
      membershipType: "ADMIN",
    });
    await expect(refused(team.change(vendor("orgAdmin"), affiliationOf(organization, "orgAdmin"), "updateAdminStatus", false))).resolves.toEqual({
      status: 400,
      body: { errors: ["You cannot change your own administrator rights."] },
    });
    await expect(refused(team.change(vendor("orgAdmin"), affiliationOf(organization, "owner"), "updateAdminStatus", true))).resolves.toEqual({
      status: 400,
      body: { errors: ["The owner's membership cannot be changed this way."] },
    });
    await expect(refused(team.change(vendor("owner"), affiliationOf(organization, "invited"), "updateAdminStatus", true))).resolves.toMatchObject({
      status: 400,
    });
    await expect(refused(team.change(vendor("outsider"), affiliationOf(organization, "orgAdmin"), "updateAdminStatus", false))).resolves.toMatchObject({
      status: 401,
    });
  });

  it("records a grant and a withdrawal, newest first, naming the member, the time and who made the change", async () => {
    const organization = await northwind();
    const member = affiliationOf(organization, "member");
    await team.change(vendor("owner"), member, "updateAdminStatus", true);
    await team.change(vendor("owner"), member, "updateAdminStatus", false);
    const { changelog } = await organizations.read(vendor("owner"), organization.id);
    expect(changelog.map((entry) => [entry.event, entry.member?.name, entry.createdBy?.name])).toEqual([
      ["ADMIN_STATUS_REVOKED", "Plain Member", "Owner Person"],
      ["ADMIN_STATUS_GRANTED", "Plain Member", "Owner Person"],
    ]);
    expect(Date.parse(changelog[0]?.createdAt as string)).toBeGreaterThan(Date.parse(changelog[1]?.createdAt as string));
  });
});

describe("transferring ownership (R-3.13)", () => {
  it("is a service administrator's alone, to an active member, and makes the previous owner an ordinary member", async () => {
    const organization = await northwind();
    const member = affiliationOf(organization, "member");
    await expect(refused(team.change(vendor("owner"), member, "changeOwner", undefined))).resolves.toMatchObject({ status: 401 });
    await expect(refused(team.change(administrator, affiliationOf(organization, "invited"), "changeOwner", undefined))).resolves.toEqual({
      status: 400,
      body: { errors: ["Ownership can only be transferred to a member who has joined."] },
    });
    await expect(team.change(administrator, member, "changeOwner", undefined)).resolves.toMatchObject({ membershipType: "OWNER" });
    expect(membershipOf(organization, "owner")?.membershipType).toBe("MEMBER");
    const record = await organizations.read(administrator, organization.id);
    expect(record.owner).toEqual({ id: "member", name: "Plain Member" });
    expect(record.changelog[0]).toMatchObject({ event: "OWNER_STATUS_GRANTED", member: { name: "Plain Member" }, createdBy: { id: "admin" } });
  });
});

describe("the organizations a vendor may act for, with the team (R-3.15)", () => {
  it("are those owned and administered, not merely joined, never archived", async () => {
    const organization = await northwind();
    const other = await organizations.create(vendor("orgAdmin"), { ...profile, legalName: "Aurora Data Collective" });
    await organizations.archive(vendor("orgAdmin"), other.id);
    expect((await organizations.actingFor(vendor("orgAdmin"))).map((entry) => entry.id)).toEqual([organization.id]);
    expect(await organizations.actingFor(vendor("member"))).toEqual([]);
  });
});
