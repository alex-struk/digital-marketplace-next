| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T05:30:42.103Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?

**Recommendation.** **The failure I couldn't reproduce.** The ruling says vendors still had their acceptance after an administrator announced changed terms.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've made one change for slice 6, but I can't say it fixes R-6.23, because I never found where the running application departs from that criterion.

**The failure I couldn't reproduce.** The ruling says vendors still had their acceptance after an administrator announced changed terms. Everything I could run says the application withdraws all of them:
- **Database query.** The withdrawal updates every row in `users` whose type is VENDOR (deactivated vendors included), clears `acceptedTermsAt` and keeps `lastAcceptedTermsAt`.
- **Full request against a database built from `tests/seed`.** I sent the announcement as an administrator through the contract check. That covered the body with no `value`, with `value: null` and with `value: {}`. The end-to-end test then checks the database and finds no vendor with an acceptance. Those three cases are now permanent tests.
- **Production settings with mail on.** I ran a throwaway test with mail switched on and the mail server refusing every connection. Reading `/api/users` straight after the answer showed no vendor still holding an acceptance, and the broadcast carried on past every failed message.
- **Every other route to acceptance.** Nothing in the backend or frontend records an acceptance except the vendor's own explicit "accept terms" request. The legal section, the sign-up completion, cached session state, the cookie session and token renewal all read fresh data.
- **Tests running alongside.** The seed manifest says the harness reseeds before every test, so tests run one at a time and another test can't re-accept in between.

**What I changed.** The announcement now answers the moment the withdrawal is committed. Reading the active vendors and sending their messages happen only after the answer. If reading the vendors fails, it's logged, and the withdrawal and the answer still stand. This narrows any gap between the confirmation and a read that follows it, and fits R-6.24 more closely. Decision record 0027 is updated to match.

**Tests added.**
- The ordering is now: withdrawn, answered, active vendors read, then sent.
- A failure to read the vendors leaves the withdrawal and a correct answer in place.
- The three body shapes above.

`npm --prefix app run check` passes in all three packages (16, 332 and 189 tests).

**What I couldn't do.** Starting the compose stack needs approval that no one here could give. So I never drove real Keycloak, Caddy, Postgres or a browser, which is exactly where the failure would have to be.

**One explanation I can't rule out.** If the acceptance test signs in as a vendor or public sector person and then as the administrator in the same browser without fully signing out, Keycloak's single sign-on could quietly keep the earlier person signed in. The administrator's announcement would then be refused and nothing withdrawn. I left sign-in alone because it belongs to earlier slices. Forcing a fresh login doesn't help either: Keycloak then asks only for the existing user's password and won't let someone else sign in.

If R-6.23 fails again, the next stage should run it against the compose stack and check three things:
- the status the announcement got;
- who the service thought was signed in when it was sent;
- whether the vendors still holding an acceptance are all of them (the request never took effect) or just a few (something accepted again afterwards).

I didn't change anything else in the slice. Nothing outside `app/` and `docs/decisions/` was touched.

_Ruled: return by runner:verify_
