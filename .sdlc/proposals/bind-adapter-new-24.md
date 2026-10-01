---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rebound the remote-work control on the Code With Us form, and it now works."
opened: 2026-10-01T07:45:10.525Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound the remote-work control on the Code With Us form, and it now works.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rebound the remote-work control on the Code With Us form, and it now works. That form was the cause of most of the reported criteria. The other four reported members still can't be bound, because their screens don't exist on the target. The TypeScript check and the suite could not be run here: there are no installed packages, and installing them was refused.

**The remote-work control (R-1.4, R-1.7, R-1.8, R-1.14, R-1.19, R-1.20, R-1.21, R-1.22, R-1.23, R-1.34, R-1.37, R-1.56, R-6.8).** In every one of these the adapter threw "no 'Is remote work acceptable?' choice" from the Code With Us form's `save_draft`, `submit_for_review` and `publish`. It was looking for a pair of Yes/No radio buttons. Signed in as the administrator, `/opportunities/code-with-us/create` shows a single checkbox labelled "Remote OK: remote work is acceptable", between Location and "Remote work description". The same box is on the edit form of a saved draft.

- **The change:** in `tests/adapters/new/index.ts`, `chooseRemote` now finds that checkbox by role and label and ticks or clears it to match the test's value. If the box is absent it falls back to the old Yes/No radios, and throws `unbound:` only when neither exists.
- **How I checked it:** I walked the flow by hand as the administrator. I entered a title, ticked "Remote OK", filled in the description and pressed "Save draft". It landed on the new draft's management screen with status Draft. I then deleted that draft so it doesn't remain on the target.
- **Bindings:** these members were already listed as `bound` in `bindings.yaml`. I only corrected the comment there that described the control as Yes/No radios.

**Still unbound, checked again:**
- **Sprint With Us and Team With Us create (`opportunity-swu-create`, `opportunity-twu-create`, R-1.8, R-1.56, R-6.15).** As the administrator, `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` both answer "Page not found".
- **The Code With Us proposal screen (`proposal-cwu-create`, R-8.22).** `/opportunities/code-with-us/<seeded published id>/proposals/create` answers "Page not found" both as the administrator and as a vendor. As a vendor, the seeded published opportunity's page has no link or button to start a proposal; it shows only the opportunity's details, skills, key dates and addenda.
- **The Team With Us evaluation screen (`evaluation-individual-create-twu`, R-6.15).** I did not reopen it this time. It sits under Team With Us opportunity routes, every Team With Us screen I opened answered "Page not found", and the earlier walk found the same.
- `/opportunities` itself also answers "Page not found" when signed in.

So the routes in `surface.yaml` that don't resolve on this target are every Sprint With Us and Team With Us screen, the Code With Us proposal screens and `/opportunities`. The existing reasons in `bindings.yaml` already say this, so I left them as they were.

**Sign-in.** Sign-in through the sandbox identity provider worked as the adapter expects, as both the administrator and a vendor: "Sign in as a public sector employee" or "Sign in as a vendor", then the provider's "Username" / "Password" / "Sign In" form.

**A stray directory.** The browser tool wrote its snapshot files into `.playwright-mcp/` at the workspace root. That is outside my territory, so I left it alone; nothing of mine is in it, and it shouldn't be delivered.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the adapter for target `new` bind every surface action and observation it can, and nothing else? Approve. The only code change is `chooseRemote` in tests/adapters/new/index.ts. It now finds the 'Remote OK: remote work is acceptable' checkbox by role and label and ticks or clears it to match the test's value. If the box is absent it falls back to the earlier Yes/No radios, and it reports unbound only when neither exists. That is locating and setting a control. It makes no assertion and contains no business logic, and the only other edit is the descriptive comment in bindings.yaml. Nothing under tests/acceptance changed, and the runner's own typecheck of the proposal's commit passed with no diagnostics under adapters/new/. The members still unbound (Sprint With Us and Team With Us create, the Code With Us proposal-create screen, the Team With Us evaluation screen) carry real reasons: each names a route that answers 'Page not found' on the target, or a missing entry point for a vendor. Each criterion involved (R-1.8, R-8.22, R-6.15) genuinely needs that screen, so none of these is a test reaching past its criterion. The failed egress check flags only pre-existing build-slice records and .sdlc/conditions.yaml, none of which this diff touches. The ruling would change if a verify run still reports the remote-work control missing on the Code With Us form after this change, since the author walked the flow by hand but could not run the suite.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `0de48c9ac7be0e606e12b5b910663c13b4c128e7`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
