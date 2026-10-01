---
stage: "build"
title: "build slice 7"
at: "2026-10-01T06:46:40.439Z"
cost: 16.4199186
turns: 219
session: "947997c6-82ea-4451-99c8-54e563e4368c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I built slice 7: a Code With Us opportunity can now be drafted, submitted for review, published and deleted, and the state rules underneath cover all three programs. `npm --prefix app run check` passes: migrations 16 tests, backend 390, frontend 221. I could not start the Docker sandbox, because Docker needs an approval nobody was here to give, so nothing was tried in a real browser or against Keycloak. Instead the backend tests run the real migrations and the acceptance seed in an in-process PostgreSQL and drive the running service over HTTP, and both workspaces' production builds succeed.

**How the criteria are reached**
- **States and permitted changes (R-1.19, R-1.20, R-1.51; R-1.49 as the table records it):** one shared rules module, `app/backend/src/rules/opportunities.ts`, holds the states and the permitted-change table for all three programs. A new migration rewrites any stored "suspended" state to "cancelled". It then adds a check on each program's history table, so the database refuses any state that program doesn't recognise.
- **Who may do what (R-1.7, R-1.22, R-1.48, R-1.53, R-1.56, R-1.29):** permissions live in the same module, so the screens and the service use one rule. The service refuses in the existing refusal shape:
  - 401 when the person may not do it;
  - 404 for an opportunity they may not read;
  - 400 for bad content, with each line starting with the field's name (`title: …`).
- **Versions and history (R-1.4):** every save writes a new version and an "Edited" history entry naming who made it. The earlier versions are kept.
- **Drafts and dates (R-1.9 to R-1.14):** a draft is saved with whatever it holds. Missing or invalid dates become 14 days out, and the completion date is left empty. Anything that isn't a draft is fully checked. Dates are calendar days stored as 4:00 p.m. Pacific time.
- **Incomplete and published date (R-1.21, R-1.23):** submitting an incomplete draft is refused with only "incomplete", not which field. The published date shown is the first publication.
- **Attachments (R-8.17, R-8.19, R-8.22, R-8.25, R-8.27):**
  - A new table links each saved version to its files.
  - The control states "Any type of file, up to 10 MB each" before a file is chosen, and refuses an oversize file on its row with the limit named.
  - A file can be renamed before upload, and its original ending is put back if left off.
  - Files are uploaded with no read access of their own; they become readable through the opportunity (anyone once published, before that only its creator and administrators).
  - Attaching a file the person can't read is refused.
- **Notices (R-1.34, R-1.37, R-6.2, R-6.8, R-6.15):**
  - Submitting for review emails every active administrator, in batches of up to 50 blind copies addressed visibly to the service. Publishing does the same for everyone who has new-opportunity notices on.
  - Both confirm separately to the author.
  - Mail goes out after the answer, so an unreachable mail server never fails the action.
- **Screens:** built from the stories:
  - the program chooser at `/opportunities/create`;
  - the create form, which offers staff "Submit for review" and administrators "Publish" with a confirmation;
  - the manage page with Summary, Opportunity and History tabs, and actions shown only when permitted;
  - the public view;
  - the not-found page for anyone not allowed in.

**Two departures from the stories,** both recorded in `docs/decisions/0029`:
- The date fields are the browser's own date input, not the design system's DatePicker. A day is then one value written and read back as YYYY-MM-DD, which is how the surface describes the input and how it reads the dates back.
- The Opportunity tab is the form itself: editable for whoever may change the opportunity, read-only otherwise. The surface reads dates "in its form" there and reaches the attachment control at that address without an Edit step; "Edit" just opens that tab.

**Tests:** rules (every program's transition table, permissions, the Pacific-time dates, validation, draft defaults, attachment naming); the service against an in-memory store (versioning, refusals, the 50/50/39 batching, publishing with a failing mail server); the HTTP test described above; and screen tests with axe checks on every new screen. One thing I found: the time zone data here has British Columbia on UTC−7 all year from late 2026, so the date test checks the Pacific clock reading rather than fixed UTC times.

**Partly built or left to later slices**
- **R-8.19 for Sprint/Team With Us:** proven only for Code With Us. The shared control always uploads with no read access, but Sprint and Team With Us forms and their attachment tables are slice 10's.
- **R-1.49:** recorded in the table only; nothing moves an opportunity to awarded yet.
- **Story test ids left out:** Watch and Start a proposal on the view, Cancel opportunity, addenda and notes, the reporting counts and the Proposals tab belong to slices 8, 9 and 14. The Addenda tab and section just say none has been added. The service answers `cancel`, `addAddendum` and `addNote` with "not available".
- **For slice 8:** no dashboard link to `/opportunities/create` and no opportunity list. A published opportunity's view count isn't recorded, and a change to one doesn't notify watchers (R-1.35, slice 9).

I touched nothing outside `app/` and `docs/decisions/`. The Prisma schema was re-generated from the migrated database, as the project does. The dependencies and build output I created locally were removed afterwards.