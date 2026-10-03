---
gate: G3
question: "Does slice 11 (A vendor can register and look after an organization) do what its criteria say?"
recommendation: "I changed nothing in this revision: the ruling found the application owed no fix for slice 11."
opened: 2026-10-03T05:09:01.641Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** I changed nothing in this revision: the ruling found the application owed no fix for slice 11.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed nothing in this revision: the ruling found the application owed no fix for slice 11. The full check passes, but no acceptance criterion has been shown to pass on the application yet. That needs a fresh verify run after the adapter is rebound, which is not this stage's work.

**What the ruling said.** Verify recorded 2 passes, 4 failures where the test read nothing, and 10 criteria the adapter could not connect to the page at all. The ruling traced every one of those to the test adapter, not the application. It sent five conditions to the adapter-binding stage. I left all five alone, as instructed, and I did not touch anything outside `app/` or `docs/decisions/`.

**What I checked in the code and evidence.** I compared the page outlines in `.sdlc/evidence/slice-11/` and the markup with what the ruling describes, and they agree:
- **Organization list (R-3.1, R-3.21):** `app/frontend/src/screens/organization-list.tsx` draws the table captioned "Registered organizations by legal name." The name column is headed "Organization", as `design/DESIGN.md` specifies. The adapter looks for a header named "organization name" or "legal name", so it finds nothing.
- **Management page sections (R-3.3, R-3.18, R-3.19 and the four image rules):** `app/frontend/src/screens/organization-edit.tsx:143` renders the sections as links inside the navigation "Organization sections", as the design specifies. The links are labelled "Organization", "Team members", "Sprint With Us qualification", "Team With Us qualification" and "Changelog". Each link carries the `data-testid` that `surface.yaml` gives it, `organization-tab-<tab>`. The R-3.18 outline shows exactly this structure. The adapter only looks for elements with the tab role, so it finds none.
- **Registering an organization (R-3.2, R-3.6, R-3.15, R-3.23):** the logo picker's trigger carries `organization-logo-button` (`app/frontend/src/app/image-picker.tsx:128`). Creating an organization is served at `/organizations/create`; the adapter still marks it as absent.
- **Owned organizations (R-3.22):** the adapter still describes the profile's Organizations section as an earlier placeholder; rebinding it to `/users/<id>?tab=organizations` is also left to the adapter-binding stage.

**Unit tests and check.** The workspace had no dependencies installed, so the first run of `npm --prefix app run check` failed with "tsc: not found". After `npm install` under `app/`, it typechecks and all tests pass:
- 16 tests in 2 files in the first test run;
- 533 tests in 36 files in the second;
- 342 tests in 20 files in the third.

One mail error appears in the log, from a test that deliberately makes delivery fail.

**Not built, and what the next slice will find missing.** Every criterion's markup is already in the application. Nothing in the specification was left unbuilt by this revision, and nothing in it is reported as missing for the next slice. If the run after rebinding fails on the application's own behaviour, that failure will come back to the build stage.
