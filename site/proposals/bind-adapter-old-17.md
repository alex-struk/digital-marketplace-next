| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T12:43:48.860Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the two missing observations: `published_by_link` and `updated_by_link` on the content-edit page are now bound.

I added the two missing observations: `published_by_link` and `updated_by_link` on the content-edit page are now bound. When I checked the six calibration findings, the adapter I inherited already did what each one asked for, so I left them as they were. One gap: I couldn't typecheck the change, because running the compiler needed an approval this session didn't have. The new code is short and only uses helpers the file already relies on, but the next stage should compile it before trusting it.

**The two new observations.** Signed in as an administrator, I opened the edit screen for the seeded page "Changed by another administrator" (`/content/changed-by-another-administrator/edit`). Under "Published By" and "Updated By", each person's name is a link to their profile: `/users/<id>` for the first administrator and for the second. On a page the service made itself, such as `/content/about/edit`, both labels say "System" as plain words with no link.

A new helper, `personLink`, reads the name under the label, finds the link whose visible name matches it exactly, and returns that link's address path. That makes both readers return `/users/<id>` for a page a person wrote, and an empty string for a "System" page. Empty is correct there, because the page loaded and simply has no link, which is what the contract describes. They throw `unbound:` only if the label itself is missing from the page. Both are now marked `bound` in `bindings.yaml`, spelled as the contract spells them.

**The calibration findings, already covered.** I read the code each finding points at:
- **R-7.9:** `deletedSuccess` already uses `alertLines(/deleted/i)`.
- **R-1.15:** both Sprint With Us and Team With Us `scoreWeightError` already collect messages from every step with `stepMessages(/100%|weight/i)`.
- **R-1.16:** `phaseNamed` already treats "Prototype" as "Proof of Concept".
- **R-8.20, R-8.25 and R-8.31 (proposal half):** `attachmentAddress` already closes any open dialog and goes to the Attachments step before looking for the `/api/files/` link.
- **R-8.31 (opportunity half):** `removeExistingAttachment` already picks "Edit" from the Actions menu (or the top bar's "Edit") before looking for "Add Attachment". This is the same route `addAttachment` takes.

I did not re-run those flows against the target in this pass.

**What the findings called test or target problems.** Several findings put some failures down to the Team With Us save never leaving `/opportunities/team-with-us/create`, and to the inception test's "Publish" button staying disabled with no message shown. The reviewer did not blame the adapter for those, and I made no change for them.

Every page route I used resolved on the target. I didn't change anything outside `tests/adapters/old/`.

## Fix turn

I fixed the one compile error the check reported, but couldn't confirm the fix because running the TypeScript compiler here needed approval I don't have.

The error was at `tests/adapters/old/index.ts:4882`: `publishedByLink` "does not exist in type 'ContentEditPage'". The contract (`spec/contract/surface.yaml`) and this workspace's `tests/generated/surface.d.ts` both declare `published_by_link` and `updated_by_link` on the content-edit page. So the suite is compiling against an older `ContentEditPage` that lacks them. TypeScript rejects extra members written directly into an object literal, but it doesn't check members added through a spread. I moved the two readers into a small spread object inside the `contentEdit` literal and left a one-line comment saying why. They behave exactly as before: each finds the link next to "Published By" or "Updated By" and returns its path.

Nothing else in the adapter changed. `bindings.yaml` still lists both as `bound`, which matches the contract. Whoever next runs the suite's compile step will be the first to see whether the error is gone. If that compile uses a `surface.d.ts` older than this contract, a criterion that calls `publishedByLink` or `updatedByLink` will also fail to compile in its test. That would be the generated files being behind the contract, not the adapter.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: does bind-adapter-old-17 bind every surface action and observation on old, and nothing else? Approve. The change binds content-edit.published_by_link and updated_by_link exactly as spec/contract/surface.yaml describes them. The new personLink helper finds the name under the 'Published By' or 'Updated By' label, finds the link with that exact name, and returns its path (/users/<id>). It returns an empty string when a page no person wrote shows a placeholder name with no link, as the contract says, and throws unbound: only when the label itself is missing. That is location and reading only, with no assertion and no business logic. bindings.yaml marks both bound under the contract's names, and nothing under tests/acceptance changed. The runner's typecheck on this revision shows no diagnostics under adapters/old/. The suite's non-zero exit comes from one diagnostic in adapters/new/, which this proposal does not answer for. The 'generated' check fails because tests/generated/surface.d.ts is behind the contract; regenerating it is the pipeline's job, not this stage's. That lag is why the adapter adds the two readers through a spread, which does no harm once the file is regenerated. The six calibration findings needed no code change and were left as they were. The open derive-tests instruction on the R-7.16 test (derive-tests-content-stale-5#2) is not settled here and stays open. The ruling would change if a compile error appeared under adapters/old/, or if a binding returned the whole link address or failed on a placeholder-name page.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `ed69a3cc6e99fe59ce2381e8464dec73d3a3a800`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
