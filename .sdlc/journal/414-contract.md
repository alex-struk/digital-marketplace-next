---
stage: "contract"
title: "contract"
at: "2026-10-02T18:27:25.635Z"
cost: 0.8130591999999999
turns: 29
session: "cb9d06bb-baf3-4c33-819c-2b7300ae7517"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

This run made one change: a single new observation that the owed test for R-1.33 needs. The oracle started cleanly with the existing override, and I took it back down afterwards.

**What was owed.** The criterion R-1.33 says the old service accepts a private note (with files) on a Code With Us or Sprint With Us opportunity's history, but no screen offers a way to add one. Its test could not check the "no screen offers it" part. Nothing in the contract could report whether the History tab of an opportunity's manage page shows any control for adding a note.

**What I added.** One observation, `note_control_offered`, is now on both `opportunity-cwu-edit` and `opportunity-swu-edit` in `spec/contract/surface.yaml`:
- It is read on the History tab (`?tab=history`).
- It is true when the tab offers any way to add a note: a text entry, a control to attach files, or a save button. It is false when the tab only lists the history.
- Its test ID is left null for the design gate to fill in, as with the other new observations.
- The comments say who can read it. Only an administrator or the opportunity's author sees the tab. On the oracle the author is `users.staffOne`, which is persona `public-sector-staff` signing in through `/auth/createsessiongov`. That account is the author of both `seed.opportunities.cwuWithPrivateNote` and `seed.opportunities.swuOpenWithSubmittedProposal`.
- The test writer's suggested wording used `persona.publicSectorStaff`, but the persona ids in `personas.yaml` are kebab-case, so the comments name `public-sector-staff`.

I checked the old front end, and nothing in it refers to adding a note (no `NOTE_ADDED` or add-note code). The expected reading on the oracle is therefore false, which agrees with the criterion. The service-level route for adding and reading notes was already in the contract on `opportunity-history-request`, so I left it alone.

Nothing else changed. Every other page, all the personas, `openapi.yaml`, `observables.yaml`, the seed (files `000` through `016` plus `manifest.yaml`) and `.sdlc/oracle/compose.yml` are as they were. In summary:
- **Pages:** the opportunity, proposal, organisation, user, evaluation, content and file pages built up over earlier runs. They include the CWU, SWU and TWU create/view/edit/complete pages and the history-by-request page.
- **Sign-in on the oracle:**
  - Administrators use `/auth/createsessionadmin`.
  - Government staff use `/auth/createsessiongov`.
  - Vendors use `/auth/createsessionvendor/:n`.
  - The anonymous visitor has `sign_in: null`.
- **Sign-in on the new target:** each persona has a sandbox-idp username matching the oracle's identity-provider id.
- **A known limit:** the oracle has only one government account. Personas that need a second, separate staff member cannot sign in on the oracle, and each of those persona entries says so itself.

**Oracle.** `oracle up` brought up four copies. The migration ran on each ("Batch 1 run: 78 migrations"), and the app containers started. As the government account, I read `/api/opportunities/code-with-us/00000000-0000-4000-a039-000000000001` through the application. It returned the seeded opportunity, with the author's private note ("Seeded private note: placeholder text…") and its attachment `opportunity-note-attachment.txt` in the history. So the seed loaded and is visible through the application. The override needed no changes. `oracle down` completed.

**Something the shell refused.** It would not expand `$SDLC_BIN` ("Contains simple_expansion"), so I ran the CLI by its absolute path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`. I also couldn't run a YAML parser over the edited file, because the command needed approval that no one was there to give. Both edits only added comment lines and a key that matches the neighbouring entries.

re-address missing-test/R-1.33 to derive-tests: added observation `note_control_offered` on `opportunity-cwu-edit` and `opportunity-swu-edit`, read on the History tab as the administrator or as the author (`public-sector-staff`, author of `seed.opportunities.cwuWithPrivateNote` and `seed.opportunities.swuOpenWithSubmittedProposal`); true when any add-a-note control is offered.