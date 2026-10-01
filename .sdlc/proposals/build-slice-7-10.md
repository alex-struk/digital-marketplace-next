---
gate: G3
question: "Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?"
recommendation: "I changed nothing in this revision."
opened: 2026-10-01T12:00:37.626Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I changed nothing in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed nothing in this revision. The ruling that returned slice 7 found nothing wrong in the code. It checked the Code With Us service, the rules module, the attachment read path, the blind-copy batching and the unit tests against the criteria they cite, and found they match. It also found no secrets or personal data.

**Why it came back.** The acceptance checks for two criteria, R-8.19 and R-8.25, could not finish. Every Code With Us case in both of them passed. The cases that couldn't run go through three screens that other slices build:
- creating a Sprint With Us opportunity, which is slice 10 under decision record 0030;
- creating a Team With Us opportunity, also slice 10;
- creating a Code With Us proposal, which comes in a later slice.

The application answers "Page not found" on all three. That is right for this slice. The ruling says the build did what slice 7 asked; the problem is that the plan gives slice 7 both criteria whole. The one condition on the ruling asks the plan stage to move R-8.19 and R-8.25 to the slices that build those screens. That condition has already been filed with the plan stage. I left `plan/tasks.md` alone: it isn't mine to change, and editing it here would end the run.

**Building the missing screens here.** I didn't. They belong to slices 10 and later, and building them in slice 7 is the overreach the task forbids.

**Checks on what is already there:**
- `app/compose/compose.yaml` still publishes the application on port 4300 and the identity provider on 8080. The application uses the realm address, http://localhost:8080/realms/digital-marketplace.
- I tried `npm --prefix app run check`, but it didn't get as far as running anything: `tsc: not found`, because packages aren't installed in this workspace.
- I didn't install them inside `app/`. There's no `.gitignore` there, so the installed packages would have gone back with the proposal.
- Copying `app/` to a scratch folder to install them there was refused by this session's permissions.

So I have not re-run the typecheck or the unit tests in this revision. The code is the same as the tree the ruling reviewed, and the runner runs the check itself after this turn.

**Still open:**
- R-1.51 has no test, for the reason given before. The ruling accepted that, since the backend end-to-end test shows the schema refuses a "suspended" state.
- The next slice will still find the Sprint With Us and Team With Us creation screens and the Code With Us proposal screens missing. Those are slice 10's and later.
- Once the plan moves the two criteria, this proposal should pass as it stands.

## Fix turn

I fixed the only thing the failed check showed: the "Not implemented: Window's scrollTo() method" lines from the frontend unit tests. The router scrolls the window on every navigation, and the jsdom test environment has no scrolling, so each call printed that message. I added a no-op `window.scrollTo` in `app/frontend/tests/setup.ts`, which every frontend test loads first. With that in place, `npm --prefix app run check` passes all three packages here without a single scrollTo line: 16 tests in migrations, 394 in backend and 233 in frontend.

The run before my change also passed every test. Its only problem was that `tsc` could not be found until I ran `npm ci` to install the dependencies, so the scrollTo noise is the only failure I could reproduce from what the check printed. If the runner failed for some other reason, its output did not show it and I could not find it. No test came near a time limit, so a timeout seems unlikely. Nothing else in the application changed. The ruling's condition about which slice R-8.19 and R-8.25 belong to is addressed to the plan stage, so I left it alone.
