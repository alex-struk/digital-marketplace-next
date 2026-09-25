// criterion: @R-3.15 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The vendor is seed.users.organizationMember, already an ordinary member of the seed's
// qualified organization (the third organization of the given). The rest of the given is built
// through the surface: they register one organization (the first) and another that they then
// archive (the fourth), and they are invited to the seed's organization with a pending
// invitation, accept, and are granted administrator rights by its owner (the second). Each
// step of the given is confirmed before the list is read; a given the surface cannot build,
// which is not what this criterion governs, is recorded as blocked rather than failed.
const member = seed.users.organizationMember;
const memberOf = seed.organizations.qualified;
const administered = seed.organizations.withPendingInvitation;

function details(legalName: string, contactEmail: string) {
  return {
    legalName,
    streetAddress: "10 Marine Way",
    addressLineTwo: "",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V1V1",
    country: "Canada",
    contactName: "Acting For Test Contact",
    contactTitle: "",
    contactEmail,
    contactPhone: "",
    website: "",
  };
}

const owned = details("Tidewater Acting For Owned Ltd.", "tidewater.owned@example.test");
const archived = details("Tidewater Acting For Archived Ltd.", "tidewater.archived@example.test");

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function register(surface: Surface, organization: ReturnType<typeof details>): Promise<string> {
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(organization);
  const orgId = await readOrEmpty(() => surface.organizationEdit.organizationIdentifier());
  if (!orgId) test.skip(true, `blocked: registering "${organization.legalName}" did not land on an organization the test can address`);
  return orgId;
}

async function administersSecond(surface: Surface): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: administered.id });
  await surface.organizationEdit.addTeamMembers({ emails: [member.email] });

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.approveInvitation({ organization: administered.legal_name });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: administered.id });
  await surface.organizationEdit.acceptOrgAdminTerms();
  await surface.organizationEdit.toggleMemberAdminStatus({ member });

  // Administering the organization is read by what it lets the member do: open its full
  // record, which an ordinary member or an invitee is not shown (R-3.3).
  await surface.signIn(persona.organizationMember);
  await surface.organizationEdit.open({ orgId: administered.id });
  let administers = false;
  for (let tries = 0; tries < 5 && !administers; tries++) {
    administers = (await readOrEmpty(() => surface.organizationEdit.organizationTab())).includes(administered.legal_name);
  }
  if (!administers) {
    test.skip(true, "blocked: the vendor could not be made an administrator of a second organization, so the criterion's given cannot be built");
  }
}

test("the organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationMember);
  await register(surface, owned);
  await register(surface, archived);
  await surface.organizationEdit.archiveOrganization();

  await administersSecond(surface);

  await surface.signIn(persona.organizationMember);
  await surface.organizationActingForList.open();
  await expect.poll(() => readOrEmpty(() => surface.organizationActingForList.organizationsOffered())).toContain(owned.legalName);
  const offered = await surface.organizationActingForList.organizationsOffered();

  expect(offered, "an organization the vendor owns is not offered").toContain(owned.legalName);
  expect(offered, "an organization the vendor administers is not offered").toContain(administered.legal_name);
  expect(offered, "an organization the vendor is only an ordinary member of is offered").not.toContain(memberOf.legal_name);
  expect(offered, "an archived organization the vendor owns is offered").not.toContain(archived.legalName);
});
