---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "`signIn` has been rewritten for the target's new sign-in screen, but I couldn't finish a real sign-in myself, so every signed-in screen, including the four new observations, is still unbound."
opened: 2026-09-30T13:02:14.528Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** `signIn` has been rewritten for the target's new sign-in screen, but I couldn't finish a real sign-in myself, so every signed-in screen, including the four new observations, is still unbound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

`signIn` has been rewritten for the target's new sign-in screen, but I couldn't finish a real sign-in myself, so every signed-in screen, including the four new observations, is still unbound. No test has been run and the code hasn't been type-checked (there's no `node_modules` in the workspace). The browser dry-run found every locator on both screens, stopping short of submitting.

**What changed on the target.** The failed criteria (R-6.2 through R-6.28, and R-4.1 through R-4.28) all came from `signIn` looking for "Sign In Using GitHub" and "Sign In Using IDIR" links, which /sign-in no longer has. It now shows two buttons, "Sign in as a vendor" and "Sign in as a public sector employee". Each one leads to the sandbox identity provider's own "Sign in to your account" form, with "Username" and "Password" boxes and a "Sign In" button. That hand-off used to end in "Login Error: Invalid parameter: redirect_uri"; now it reaches a working form. /sign-up changed the same way ("Sign up as a vendor", "Sign up as a public sector employee").

**What I changed in `tests/adapters/new/index.ts`:**
- **`signIn`:**
  - It still throws `unbound: signIn.<id> — <reason>` when a persona's entry says it is unavailable.
  - It picks the vendor button when the sandbox username contains "vendor" (all vendor usernames do), and the public sector button otherwise.
  - It fills the provider's form with the persona's username and the password from `SDLC_SANDBOX_PASSWORD`, then presses "Sign In".
  - It waits to land back on the marketplace. If the provider keeps the browser, `signIn` throws a plain error (not `unbound:`) quoting what the provider said, since that is a real sign-in failure.
  - It finds the password box as a textbox named "Password", because a nearby "Show password" button would also match a looser label search.
- **Sign-in and sign-up screens:** the two press actions on each screen use the new labels, and the card readers use the new headings ("Vendor", "Public sector employee").
- **Stale reasons:** the shared reason for signed-in screens no longer says "nobody can sign in". It now says the provider form is reachable but these screens were never walked signed in. The descriptions of what those screens show when signed out are also updated: /dashboard now redirects to /sign-in, and the not-found page reads "Page not found".

**Why I couldn't sign in myself.** The browser tool's process doesn't have the sandbox password. Reading it from my shell, or running a small script that would have used it, needed an approval nobody was here to give. I didn't guess or invent a password.

**The four new members.** `evaluation_question_fields` on opportunity-swu-create, opportunity-swu-edit, opportunity-twu-create and opportunity-twu-edit are in the adapter and named once each in `bindings.yaml`, all unbound. I opened both create routes signed out and each showed "Page not found". The two edit routes are the ones already recorded as showing "Page not found" with the seeded closed opportunities. Each reason says what was tried and that no question's fields were seen.

**Bindings file.** I updated the repeated old reason and the header and sign-in comments in `tests/adapters/new/bindings.yaml`. All four names use the contract's spelling, with none duplicated or missing.

**Routes.** Every route I opened resolved. The signed-in ones answer a signed-out visitor with "Page not found" or a redirect to /sign-in, which is the expected refusal rather than a missing page.

**What should happen next.** The next calibration should get past `signIn`, since it now has the password from the environment. Its tests will then stop at the signed-in screens, which still report unbound because nobody has seen them signed in. The next binding run should be given a way to sign in, so it can bind those screens, starting with the question fields on the Sprint With Us team questions step and the Team With Us resource questions step.

I changed nothing outside `tests/adapters/new/`. I also left a small helper script in my scratch space; it contains no secret and is not part of the proposal.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on `new`, and nothing else? Ruling: approve. The diff changes only tests/adapters/new/ and nothing under tests/acceptance or app/. The bindings are navigation and locators only. signIn now drives the sign-in screen's new 'Sign in as a vendor' / 'Sign in as a public sector employee' buttons and the sandbox identity provider's Username/Password/'Sign In' form, and it throws a plain error rather than an 'unbound:' one when the provider keeps the browser. That is a failure to get somewhere, not a pass/fail decision. Its rule for choosing the vendor button (username contains 'vendor') holds for every persona in tests/generated/personas.ts (test-vendor-1..7, test-gov, test-admin). The four new evaluation_question_fields members are present in the adapter and named once each in bindings.yaml. The runner's typecheck passed with no diagnostics under adapters/new/. One caution: the refreshed unbound reasons for signed-in screens describe a limit of the binding session (it had no usable sandbox password), not something missing from the target. They are accurate and do not blame the application, and a return could not fix them, because this stage cannot give itself the password. What would change the ruling: if the next calibration shows signIn failing against the provider form, or if a later binding run with a working sign-in still leaves these reasons in place instead of binding those screens, that run should be returned.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `436d5fe38fb17c330be6460f8c3a66fccb7b978c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
