---
gate: G3
question: "Do these tests follow from the files criteria and from nothing else?"
recommendation: "I derived acceptance tests for the 31 accepted criteria of the **files** domain from the contract alone — `tests/generated/surface.d.ts`, `personas.ts`, `seed.ts` and the seed manifest."
opened: 2026-09-07T14:32:15.700Z
---

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I derived acceptance tests for the 31 accepted criteria of the **files** domain from the contract alone — `tests/generated/surface.d.ts`, `personas.ts`, `seed.ts` and the seed manifest.

I've finished. Thirteen spec files and eighteen not-testable entries, covering all 31 criteria.

## Journal

I derived acceptance tests for the 31 accepted criteria of the **files** domain from the contract alone — `tests/generated/surface.d.ts`, `personas.ts`, `seed.ts` and the seed manifest. Thirteen criteria got a spec file under `tests/acceptance/files/` (17 `test()` blocks in all); the remaining eighteen got entries in `tests/acceptance/not-testable.yaml`, appended after the notifications entries already there.

**Tested:** R-8.1, R-8.2, R-8.10, R-8.12 (two tests, vendor and administrator), R-8.14, R-8.20, R-8.21, R-8.23, R-8.25 (two tests), R-8.27, R-8.28 (two tests, picture and logo), R-8.29, R-8.30.

**Not testable:** R-8.3, R-8.4, R-8.5, R-8.6, R-8.7, R-8.8, R-8.9, R-8.11, R-8.13, R-8.15, R-8.16, R-8.17, R-8.18, R-8.19, R-8.22, R-8.24, R-8.26, R-8.31.

The single fact that decided most of that split is this: **nothing in the surface ever hands a test a stored file's identifier.** The `file-download` entry is addressed by one, and its three refusal observations (`refused_when_not_permitted`, `refused_for_unknown_file`, `not_found_for_administrator`) plainly exist to be asked for one, but no page, action or observation returns the identifier of a file a test has just uploaded. So the only way a test reaches a file is by following the download offered against an attachment on a screen the requester can already open — which is, by construction, a file they are allowed to read. Every criterion whose outcome is a refusal of a file that *exists* (R-8.5, R-8.7, R-8.8, R-8.15, R-8.19, R-8.22, R-8.26, R-8.31) dies there. I used a seeded opportunity's identifier as "an identifier no stored file carries" to reach the unknown-file half of R-8.12 rather than inventing one.

Second, uploads in the surface are always assembled by a control — `add_attachment`, `choose_image`, `upload_body_image` — which settles the submission's size, its read-access statement and its multipart shape on the person's behalf. That makes the whole malformed/oversized/invalid-access family (R-8.3, R-8.4, R-8.17, R-8.18, R-8.24) unreachable at the *given*, quite apart from there being no observation for their outcomes.

**Surface actions and observations I needed and did not find**, so the contract can be extended:

- An observation returning a stored file's identifier (on the attachment control, the image picker, or the embedded-image control), and one returning the file *record* rather than its content — its identifier, the date it was stored, who uploaded it, and the content fingerprint. Those four values alone unblock R-8.5, R-8.6, R-8.7, R-8.11, R-8.15, R-8.19, R-8.22, R-8.26 and R-8.31.
- An action that attaches a file already stored, named by identifier, rather than choosing one to upload (R-8.15, R-8.22).
- An observation reporting an upload refused for size and the message it carries, and one reporting the size limit stated on the control *before* a file is chosen (R-8.3, R-8.17). The only refusal observation on the attachment control is `file_name_error`.
- Actions that submit a deliberately bad upload — no file part, no read-access statement, an unrecognised kind of access — and an observation reporting an upload refused as carrying invalid information, distinct from an observation reporting a fault of the service (R-8.4, R-8.18, R-8.24).
- An observation reporting a stored image's dimensions, and a way to state the dimensions of the image an action uploads (R-8.13).
- The attachment control is listed only on the three opportunity forms and the Code With Us proposal form. No proposal *view* offers attachments at all, so a proposal's attachment can be reached by nobody but its author — which blocks R-8.9 outright and forced me to leave the proposal half of R-8.20 and R-8.25 unasserted.
- Nothing observes the service's own machine: no working directory, no error log. `observables.yaml` names email, file addresses, exports, a status trigger and counters, and none of them reach R-8.16 or the log half of R-8.18.
- An observation reporting whether a stored file is still referred to by any record (R-8.31's "identifiable as detached").
- Outside this domain but felt inside it: `opportunity-list` has no action that opens one of its rows, and nothing returns the identifier of an opportunity a test has just created. Since the seed carries no Sprint With Us or Team With Us opportunity, a second persona can never reach one, so the three-program halves of R-8.8, R-8.19 and R-8.20 cannot be walked even though the attachment control exists on those forms.

Two things worth flagging to whoever rules this proposal. R-8.14 and R-8.21 are a superseded/replacement pair whose tests assert opposite outcomes for the same act — a non-image named `portrait.png` chosen as a profile picture is accepted by one test and refused by the other; that is deliberate, and both are accepted criteria. And several files assert only part of their criterion, with a header comment saying which half was withheld and why: R-8.1 (the signed-out refusal), R-8.2 (the read-access statement and the returned identifier and date), R-8.12 (a file that exists but may not be read), R-8.20 and R-8.25 (the Sprint With Us, Team With Us and proposal paths), R-8.21 (the resize-failure clause) and R-8.23 (the nameless-upload clause).

I could not typecheck or run anything: `tests/node_modules` is absent and installing dependencies is outside what this stage owns. I checked the files by hand against the separation rules in `tests/README.md` — no `page.`, no locator or test-id, no route-shaped or absolute-URL literal, imports only from `../../fixtures`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether these tests follow from the files criteria and from nothing else, and they do. All 31 accepted criteria are accounted for — 13 spec files, 18 not-testable entries, versions matching the spec. Every surface member, persona and seed handle used resolves against tests/generated/, and every persona/seed pairing is consistent with the seed's own relations. No implementation leaks: no page object, locator, test-id or route-shaped literal in any of the 13 files. The not-testable reasons name what is actually missing from the surface rather than what was inconvenient — I confirmed the load-bearing one independently, that tests/fixtures/index.ts exposes only surface and mail and that no observation in surface.d.ts returns a stored file's identifier, which is what genuinely blocks the eight refusal-of-an-existing-file criteria; likewise that ProposalTwuViewPage names no attachment action (R-8.9) and that observables.yaml exposes no log or filesystem (R-8.16, R-8.18). The R-8.14/R-8.21 contradiction is not a derivation error but the convention this repo already ratified at G3 for the R-6.14/R-6.19 pair in notifications, and it was flagged rather than buried. Assertions drawn from criterion note bullets (existingAttachmentNameReadOnly in R-8.27, onlyJpegAndPngOffered in R-8.30) are in scope, since notes are part of the criterion record. Tier is STANDARD, the receipt marks no residual risk as unaccepted, and it honestly discloses that typecheck could not run because tests/node_modules is absent — which I confirmed. What would change the ruling: a test asserting an outcome its criterion does not state, a not-testable entry whose named gap turns out to exist in the surface, or a typecheck failure once dependencies are installed.

**Conditions:**
- The suite is unverified by tsc: tests/node_modules is absent, so no file here has been typechecked. Run npm run typecheck over tests/acceptance/files/ at bind-adapter, when dependencies are first installed, and treat a failure there as reopening this gate rather than as adapter work.
- R-8.14 and R-8.21 cannot both pass. Before the acceptance suite is used as a pass/fail gate on the rebuild, a ruling is needed on whether a defect criterion carrying superseded-by should stay state: accepted and keep its test, or drop out of the suite once its replacement is written. This applies equally to the R-6.14/R-6.19 pair already merged, so it is a spec-process decision, not a fix to this branch.
- The seven partly-asserted criteria (R-8.1, R-8.2, R-8.12, R-8.20, R-8.21, R-8.23, R-8.25) and the eighteen not-testable entries turn almost entirely on one missing observation: nothing returns a stored file's identifier. The journal's list of needed surface actions and observations should be carried to whoever owns the contract as a proposed extension, since roughly two thirds of this domain's coverage is waiting on it.
