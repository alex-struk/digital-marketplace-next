---
gate: G3
question: "Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?"
recommendation: "I made one targeted correction for R-4.23."
opened: 2026-09-30T23:41:41.849Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** I made one targeted correction for R-4.23.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made one targeted correction for R-4.23. It is reasoned from the code, not confirmed against the running application: the sandbox could not be started from this session, because `docker compose` needs an approval nobody was there to give. `npm --prefix app run check` passes in all three workspaces (15, 199 and 105 tests).

**What I changed for R-4.23.** The ruling said only that a value the test expected read as empty, so I couldn't tie it to one element. I looked for what sets this criterion apart from the others in the slice. It is the only one whose check uses two different people one after the other: a public sector employee signing in for the first time, then a vendor who has already agreed to the terms.

Decision record 0018 already notes how the acceptance harness signs someone out between people: it clears the browser's cookies and opens the home page, and leaves local storage alone. On the oracle the session is a cookie, so that signs the person out. Here the tokens lived only in local storage. After the harness's sign-out, the app still sent the first person's token and drew every screen for them, and the sign-in screen even sent the browser on to their dashboard. The second person in R-4.23 would arrive in a browser that still belonged to the first.

The fix, in `app/frontend/src/auth/identity-client.ts`: the tokens stay in local storage, but they now count only while a flag-only cookie, `dm-signed-in`, is also present. The cookie is set whenever tokens are kept (after sign-in and on renewal) and cleared whenever they are forgotten. Tokens found without it are dropped and the app starts as a visitor's. I added unit tests for setting the cookie, for starting signed out once cookies are cleared, and for requests carrying no token after that. The existing tests were adjusted to hold the cookie. The reasoning is in `docs/decisions/0020-clearing-cookies-signs-the-browser-out.md`, and `app/README.md` now says where the browser keeps its sign-in.

**Also fixed.** The sandbox realm lacked three seeded accounts the manifest names: `seed-team-pending`, `seed-team-former` and `seed-team-outsider`. I added them to `app/compose/idp/realm-template.json` as code-hosting (vendor) identities with the manifest's names and addresses, so every seeded person can sign in. `migration_user` is left out on purpose, since the manifest says it is not a person.

**The owed condition `build-slice-2-12#3` (recheck R-4.1 and R-4.3).** The latest ruling lists only R-4.23 as failing, which suggests both now pass against the rebound adapter. I re-read both paths without running them. For R-4.1, a first sign-in makes an active account of the kind the identity implies, carrying the identity provider's name, email and username, and a second sign-in finds the same account; the profile at `/users/me` shows all of it. For R-4.3, the Complete button stays disabled until the agreement box is ticked, and completing records `acceptedTermsAt` and `lastAcceptedTermsAt`, shown on the legal section. I found no remaining departure. Since I couldn't run the suite, this is not confirmed live.

**Left undone.** If the test was instead reading something on the dashboard to confirm arrival (its empty-state message, or the vendor's proposals list), this revision won't satisfy it. The dashboard here is still only a heading and who is signed in, because its contents belong to slices 6 and 8 (the staff and vendor dashboards). Building them would take opportunity and proposal reads this slice doesn't own. If R-4.23 still fails after this revision, the next place to look is whether its check needs those dashboard observations; if it does, the criterion can't pass until those slices land.

The other criteria (R-4.2, R-4.17, R-4.24, R-6.1) are unchanged from the previous revision, and nothing under `spec/`, `plan/`, `design/` or `tests/` was touched.
