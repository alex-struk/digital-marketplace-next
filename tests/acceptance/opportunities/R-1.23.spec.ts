// criterion: @R-1.23 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The published date comes back as free text, and no observation says in which shape, so
// the moment of publication is looked for by the day of the month and the year of the day
// the test published on, both of which stand in whatever shape the date is written.
//
// The criterion's closing clause — that the date stays the moment of the first publication
// even if the opportunity was later republished — is not asserted: no action in the surface
// publishes an opportunity that is already published, so there is no republication to make.

test("publishing an opportunity records the moment of publication, which is thereafter shown as its published date", async ({
  surface,
}) => {
  const title = "R-1.23 opportunity whose published date is read back";
  const today = new Date();

  function inDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    reward: 5000,
    skills: ["Backend Development"],
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
  });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.signOut();
  await surface.opportunityCwuView.open({ opportunityId });

  const published = await surface.opportunityCwuView.publishedDate();
  expect(published).toBeTruthy();
  expect(published).toContain(String(today.getDate()));
  expect(published).toContain(String(today.getFullYear()));
});
