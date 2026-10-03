import {
  Member,
  MembershipChange,
  MembershipEvent,
  NewOrganization,
  OrganizationChange,
  OrganizationStore,
  Person,
  StoredOrganization,
} from "../src/organizations/organization";
import { MembershipType } from "../src/rules/organizations";
import { CAPABILITIES } from "../src/rules/users";

/** The people the organization tests use, by account identifier. */
export const people: Record<string, { name: string; email: string; capabilities: string[] }> = {
  owner: { name: "Owner Person", email: "owner@example.test", capabilities: CAPABILITIES.slice(0, 5).map((c) => c.name) },
  orgAdmin: { name: "Org Admin", email: "org.admin@example.test", capabilities: CAPABILITIES.slice(5).map((c) => c.name) },
  member: { name: "Plain Member", email: "member@example.test", capabilities: [] },
  invited: { name: "Invited Person", email: "invited@example.test", capabilities: [] },
};

/** Accounts an invitation can find by email, beyond those in `people`. */
export const accounts: Person[] = [
  ...Object.entries(people).map(([id, known]) => ({ id, name: known.name, email: known.email, type: "VENDOR" as const, status: "ACTIVE" as const })),
  { id: "outsider", name: "Outside Vendor", email: "outsider@example.test", type: "VENDOR", status: "ACTIVE" },
  { id: "staff", name: "Staff Person", email: "staff@example.test", type: "GOV", status: "ACTIVE" },
  { id: "gone", name: "Gone Vendor", email: "gone@example.test", type: "VENDOR", status: "INACTIVE_ADMIN" },
];

let memberships = 0;

/** A membership of this person, with an identifier of its own. */
export function person(
  userId: string,
  membershipType: Member["membershipType"],
  membershipStatus: Member["membershipStatus"] = "ACTIVE",
): Member {
  memberships += 1;
  const known =
    people[userId] ??
    (() => {
      const account = accounts.find((candidate) => candidate.id === userId);
      return { name: account?.name ?? userId, email: account?.email ?? `${userId}@example.test`, capabilities: [] };
    })();
  return {
    affiliationId: `00000000-0000-4000-a000-${String(memberships).padStart(12, "0")}`,
    userId,
    name: known.name,
    email: known.email,
    type: "VENDOR",
    capabilities: known.capabilities,
    membershipType,
    membershipStatus,
    createdAt: "2026-10-01T00:00:00.000Z",
  };
}

/** Organizations kept in memory, as the kept tables hold them. */
export class OrganizationsInMemory implements OrganizationStore {
  readonly rows: StoredOrganization[] = [];
  private next = 1;
  private clock = Date.parse("2026-10-02T00:00:00.000Z");

  async listActive() {
    return this.rows.filter((row) => row.active);
  }

  async find(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async affiliatedWith(userId: string) {
    return this.rows.filter((row) => row.members.some((member) => member.userId === userId));
  }

  async create(organization: NewOrganization): Promise<StoredOrganization> {
    const { ownerId, ...fields } = organization;
    const id = `00000000-0000-4000-8000-${String(this.next++).padStart(12, "0")}`;
    const row: StoredOrganization = {
      ...fields,
      id,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      active: true,
      deactivatedOn: null,
      deactivatedBy: null,
      acceptedSWUTerms: null,
      acceptedTWUTerms: null,
      members: [person(ownerId, "OWNER")],
      serviceAreas: [],
      events: [],
    };
    this.rows.push(row);
    return row;
  }

  async update(id: string, change: OrganizationChange): Promise<StoredOrganization> {
    const index = this.rows.findIndex((row) => row.id === id);
    const current = this.rows[index] as StoredOrganization;
    const { deactivatedOn, ...rest } = change;
    const next: StoredOrganization = {
      ...current,
      ...rest,
      ...(deactivatedOn ? { deactivatedOn: deactivatedOn.toISOString() } : {}),
    };
    this.rows[index] = next;
    return next;
  }

  async findByMembership(affiliationId: string) {
    return this.rows.find((row) => row.members.some((member) => member.affiliationId === affiliationId)) ?? null;
  }

  async peopleByEmail(email: string): Promise<Person[]> {
    return accounts.filter((account) => account.email?.toLowerCase() === email.toLowerCase());
  }

  async invite(organizationId: string, userId: string, membershipType: MembershipType): Promise<StoredOrganization> {
    const member = { ...person(userId, membershipType, "PENDING"), affiliationId: this.identifier() };
    return this.replace(organizationId, (row) => ({ ...row, members: [...row.members, member] }));
  }

  async changeMembership(affiliationId: string, change: MembershipChange): Promise<StoredOrganization> {
    const row = (await this.findByMembership(affiliationId)) as StoredOrganization;
    const { event, ...fields } = change;
    return this.replace(row.id, (current) => ({
      ...current,
      members: current.members.map((member) => (member.affiliationId === affiliationId ? { ...member, ...fields } : member)),
      events: event ? [...current.events, this.event(affiliationId, event.kind, event.by)] : current.events,
    }));
  }

  async transferOwnership(organizationId: string, toAffiliationId: string, by: string): Promise<StoredOrganization> {
    return this.replace(organizationId, (current) => ({
      ...current,
      members: current.members.map((member) =>
        member.affiliationId === toAffiliationId
          ? { ...member, membershipType: "OWNER" }
          : member.membershipType === "OWNER"
            ? { ...member, membershipType: "MEMBER" }
            : member,
      ),
      events: [...current.events, this.event(toAffiliationId, "OWNER_STATUS_GRANTED", by)],
    }));
  }

  /** Adds memberships to an organization directly, as the seed would. */
  withMembers(organizationId: string, members: readonly Member[]): StoredOrganization {
    const index = this.rows.findIndex((row) => row.id === organizationId);
    const row = this.rows[index] as StoredOrganization;
    this.rows[index] = { ...row, members: [...row.members, ...members] };
    return this.rows[index] as StoredOrganization;
  }

  private event(affiliationId: string, kind: MembershipEvent["event"], by: string): MembershipEvent {
    this.clock += 60_000;
    return {
      id: this.identifier(),
      affiliationId,
      event: kind,
      createdAt: new Date(this.clock).toISOString(),
      createdBy: { id: by, name: people[by]?.name ?? by },
    };
  }

  private identifier(): string {
    return `00000000-0000-4000-9000-${String(this.next++).padStart(12, "0")}`;
  }

  private replace(id: string, change: (row: StoredOrganization) => StoredOrganization): StoredOrganization {
    const index = this.rows.findIndex((row) => row.id === id);
    this.rows[index] = change(this.rows[index] as StoredOrganization);
    return this.rows[index] as StoredOrganization;
  }
}
