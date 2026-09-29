---
stage: "contract"
title: "contract"
at: "2026-09-29T07:22:08.616Z"
cost: 1.4715217999999994
turns: 41
session: "276e1f89-93a7-454b-a9ff-ff5478440097"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

## Journal: contract run for missing-test R-6.2

This run had one owed item: the composition half of R-6.2. The criterion says that when a message "cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made." An earlier contract run already covered the delivery half through the mail catcher's fault switch (the `mail-delivery-fault` surface), and the test for that half runs. The test writer asked for one of two things for the composition half:

- a seeded record whose content makes a named notice fail to render when an action the contract already offers triggers it, or
- if no such record can exist, a restatement of the clause from ratify.

**I found no such record, and I don't think one can exist within the old application's schema.** Here is how the old mailer is built, at the configured commit:

- **The only catch point for composition failure** is `makeSend` in `src/back-end/lib/mailer/transport.ts` (lines 52–67). It calls a notice's builder (the `…T` functions), logs "Unable to create email content" if the builder throws, and returns without retrying.
- **Every database read happens outside that catch.** The reads live in the `handle…` functions, and each one goes through `getValidValue(…, null)`, which turns a failed read into a null fallback instead of a throw. The handlers then skip the notice when a record is missing.
- **The builders themselves are pure.** They work only on records the application has already validated. They do string interpolation, `formatAmount`, moment-based `formatDate`/`formatTime` (which return "Invalid date" instead of throwing) and React's static renderer. I checked the opportunity, proposal, affiliation, organization, terms and user notices, and none of them dereference anything a stored value could make throw.
- **One quirk looks relevant but isn't.** A negative amount makes `formatAmount` loop forever. That would freeze the whole server rather than cause a composition failure the service survives. Seeding it would also break the oracle for every other test, so I did not.

So this clause can't be observed from outside the application on the old target. From every observer's point of view, a composition failure looks exactly like "no message was sent". I'm handing it to ratify for the restatement the item itself allows.

**Contract files:** I left them unchanged, because the owed item needed nothing new in them. I checked the existing contract without rewriting it:
- `surface.yaml` has its route-parameter sourcing notes and a domain on every page.
- `personas.yaml` gives each persona an entry for both configured identities: `session-route` for the oracle and `sandbox-idp` for the new target. It uses `null` for the anonymous visitor and `unavailable` where the old target has no way to act as a role.
- `openapi.yaml` keeps its recovery header.
- `observables.yaml` uses `${SDLC_MAIL_API}` and includes the delivery-fault switch.
- The seed runs from `000-installation.sql` to `015-profile-completion.sql`. Its synthetic users (administratorOne, staffOne, vendorOne, the organization owner, admin and member, a deactivated vendor, and others) and its opportunities, proposals, evaluation, file and content fixtures are all named in `tests/seed/manifest.yaml`.

I couldn't run a YAML parser because this session's permissions refused `python3`, so those checks were done by reading and searching the files.

**Oracle:** it starts, and I changed nothing in `.sdlc/oracle/compose.yml`.
- The session refused `$SDLC_BIN` expansion, so I ran the same CLI by its path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`, as earlier runs did.
- I ran `oracle down` first to clear anything left over, then `oracle up`. It started four copies on the first attempt and printed no errors: `oracle up: http://localhost:4300 (mail API http://localhost:8025), 4 copies`.
- To confirm the migration ran and the seed loaded, I fetched the seeded published Code With Us opportunity (manifest handle `publishedCodeWithUs`) through the application's API. It came back with its title "Seeded published Code With Us opportunity" and status PUBLISHED.
- I then ran `oracle down`, and no containers are left running.

**Not done:** the composition clause of R-6.2 is still not testable on this target. The reasons are above.

re-address missing-test/R-6.2 to ratify: on the old target no stored value can make a notice fail to compose. All database reads sit outside makeSend's catch behind getValidValue null fallbacks, and the builders inside it are pure renderers of records the application has already validated (transport.ts:52–67, notifications/*). Seen from outside the application, a composition failure looks exactly like "no message was sent". The clause needs restating in terms something can observe, or folding into the delivery half, which is already tested through mail-delivery-fault.