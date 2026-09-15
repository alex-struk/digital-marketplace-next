---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-15T05:54:53.444Z"
cost: 1.469122
turns: 28
session: "b7b663c0-6826-4246-9bf5-f004f345967f"
---

I rewrote the one criterion in this batch, R-2.13 v1, and it has a test file. Nothing was sent to `not-testable.yaml`, and R-2.13 had no entry there already. I couldn't type-check the file: there is no `node_modules` in the workspace, so neither `tsc` nor Playwright has run on it.

The workspace already had an approved R-2.13 test, and a redo note came with it. The note said the no-proponent case should not expect a reason shown against a choice the person never made. It said to treat a submission that can't be made as the refusal, and to check that nothing was submitted. It also said to expect the field to be named only in the text and comments cases, with time allowed for the error to appear. The rewrite does all of that.

The file has four tests, one for each case the criterion's "when" lists: empty proposal text, proposal text over 10,000 characters, additional comments over 10,000 characters, and no proponent. Each test title is the criterion's own statement with the case in brackets. In each test an administrator publishes a new Code With Us opportunity, because the only seeded open one is shared with other tests. Then the vendor persona fills in the proposal form with everything correct except the one thing under test.

- **Text and comments cases:** the test waits for `proposalCwuCreate.fieldError()` to show something (`expect.poll`), which covers the time the note asked for. It then checks that the opportunity's title is not in `proposalVendorDashboard.myProposalsTable()`.
- **No-proponent case:** the test asserts no error message. It tries `submitProposal`, and if the screen won't carry that out, the test counts that as the refusal rather than a failure. The only check is that no proposal shows up in the vendor's own list.

I also made one fix the note didn't ask for. The old test called `chooseProponentIndividual()` with no details, so the "valid" proponent in the text and comments cases may not actually have been complete. That would have let a refusal come from the proponent rather than the field under test. The rewrite now passes a full individual (legal name, email, phone and full postal address), with the same field names R-2.14 uses.

Two parts of the criterion can't be fully checked with the current contract, and I left them out rather than guess:
- **Which field the error names:** the criterion says the response names the offending field. `proposalCwuCreate.fieldError()` returns all the screen's errors as one string, so the tests only check that an error appears. A per-field observation on the create page, such as a proposal-text error and an additional-comments error, would let the test confirm the right field is named.
- **Whether submitting was possible:** no observation says whether submitting is currently allowed. The only one is `submitDisabledUntilTermsAccepted`, and it is tied to the terms. An observation like "submit unavailable until a proponent is chosen" would let the no-proponent test state the refusal directly instead of tolerating an action that fails.

The criterion also sets a lower bound (1 to 10,000 characters) that implies text at exactly 10,000 characters is accepted. Its given/when/then only describes refusals, so I didn't test the boundary being accepted.