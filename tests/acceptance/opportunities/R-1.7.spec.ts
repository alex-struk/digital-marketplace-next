// criterion: @R-1.7 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Each test makes the creation attempt the criterion names and then reads whether an
// opportunity came of it, rather than reading anything about what the requester was
// offered on the way. The reading is done by an administrator, who sees every
// opportunity in whatever state it did or did not reach; a draft that had been created
// would stand in the unpublished group. The same draft content — a title alone — is
// accepted from a permitted requester in R-1.48, so nothing but the requester's standing
// is left to refuse it here.

test("a vendor attempting to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  const title = "R-1.7 opportunity a vendor tried to create";

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).not.toContain(title);
});

test("an anonymous visitor attempting to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  const title = "R-1.7 opportunity an anonymous visitor tried to create";

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  await surface.signIn(persona.administrator);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).not.toContain(title);
});
