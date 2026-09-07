// criterion: @R-4.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// KNOWN RED — the first two tests below, on a full-suite run. Recorded here rather than in
// attestations.yaml, which records who vouched for a hand-edited spec file; this is a fixture
// ordering hazard, so it belongs with the tests that suffer it.
//
// seed.users.vendorWithTermsReset is the only seeded account holding back its agreement to the
// current terms (accepted_current_terms: false in tests/seed/manifest.yaml). That state is
// one-shot: the first test in a run that agrees on its behalf spends it for every test after,
// and nothing in the suite restores it for one account alone. Three files draw on it — R-4.23
// reads it without spending it, R-4.24 spends it, and this file reads it and then spends it.
// The suite runs single-file, single-worker (fullyParallel false, workers 1), so whichever
// spending file runs first wins; the default path order sorts "R-4.24.spec.ts" ahead of
// "R-4.3.spec.ts", so this file finds the account already agreed and its first two tests fail
// for a reason that has nothing to do with what R-4.3 asserts. The third test signs in as a
// different persona and is unaffected.
//
// Deliberately not marked test.fail(): the failure is an artifact of the fixtures, and an
// expected-failure annotation would swallow a genuine regression in the behaviour R-4.3
// describes just as quietly. The remedy is a seed change, which is outside this stage — either
// a second vendor account with its agreement withheld, so each spending file has its own, or a
// reseed between files. Until one lands, these two tests are red in a full run and green when
// this file runs alone against a freshly seeded database.

test("a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();
  expect(await surface.userSignUpComplete.completeDisabledUntilTermsAccepted()).toBeTruthy();
});

test("the moment of acceptance is recorded on the vendor's account", async ({ surface }) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileLegal.open({ userId: seed.users.vendorWithTermsReset.id });
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
});

test("a public sector employee is never asked to agree to the terms and conditions", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userSignUpComplete.open();

  expect(await surface.userSignUpComplete.termsCheckbox()).toBeFalsy();
});
