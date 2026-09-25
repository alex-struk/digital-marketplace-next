// criterion: @R-3.17 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is an organization whose owner is inviting a team member: the seed's qualified
// organization, owned by seed.users.organizationOwner, inviting seed.users.vendorOne, a
// registered vendor who belongs to it in no way. The invitation is made as a request, which is
// the only way to name a membership type the team page never sends. The membership types are
// named as the service's interface names them (spec/contract/openapi.yaml,
// CreateAffiliationRequestBody): MEMBER and OWNER are the two an invitation may name, and ADMIN
// is the other type that interface knows of.
const organization = seed.organizations.qualified;
const invited = seed.users.vendorOne;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function ownerInvites(surface: Surface, membershipType: string): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.affiliationInvitationRequest.open();
  await surface.affiliationInvitationRequest.inviteWithMembershipType({
    organization,
    email: invited.email,
    membershipType,
  });
}

test("an invitation may name the invited person as an ordinary member", async ({ surface }) => {
  await ownerInvites(surface, "MEMBER");

  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invitationCreated())).toBeTruthy();
  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invalidMembershipTypeError())).toBeFalsy();
});

test("an invitation may name the invited person as an owner", async ({ surface }) => {
  await ownerInvites(surface, "OWNER");

  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invitationCreated())).toBeTruthy();
  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invalidMembershipTypeError())).toBeFalsy();
});

test("an invitation naming any other membership type is rejected as an invalid membership type", async ({ surface }) => {
  await ownerInvites(surface, "ADMIN");

  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invalidMembershipTypeError())).toBeTruthy();
  expect(await readOrEmpty(() => surface.affiliationInvitationRequest.invitationCreated())).toBeFalsy();
});
