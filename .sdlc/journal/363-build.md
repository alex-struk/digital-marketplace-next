---
stage: "build"
title: "build slice 7"
at: "2026-10-01T10:35:37.151Z"
cost: 0.20557419999999998
turns: 5
session: "b1fbbe99-a626-4289-97fa-a79113597482"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I left the application as it was: this revision changes nothing under `app/` or `docs/decisions/`. The ruling found the application correct and sent all five conditions to bind-adapter, which builds the test adapter for this target. None of them asks this stage to change the application. Changing it anyway would mean the adapter gets fixed against a different application from the one the ruling looked at, and the ruling says that is how to tell whose fault a failure is.

**Check:** `npm --prefix app run check` passes: it typechecks every package under `app/` and runs the unit tests (233 frontend tests in 14 files, and the backend tests). The first run failed with `tsc: not found` because this workspace had no installed dependencies. After `npm ci` it passed. That is a problem with the workspace, not the application, and `package-lock.json` is unchanged.

**Criteria:** Slice 7's 18 criteria are built as the earlier rounds of this slice left them. What each one does in the running application, as the ruling reads it:
- **R-8.19 and R-8.25 (attachments):** a chosen file is stored as soon as it is picked, and its row shows an `/api/files/` download link. The row is still worded "New: \<name\>, \<size\>" (`app/frontend/src/app/attachments.tsx:347`), and the adapter currently discards rows with that wording. I kept the wording because the condition sent to bind-adapter is written against that exact row.
- **R-1.22 (publish):** Publish is offered to an administrator on a draft or an opportunity under review (`opportunity-cwu-edit.tsx:137`). For public sector staff it is missing, which is the refusal the criterion asks for.
- **R-1.21 (edit):** on a draft, the opportunity tab shows the form already editable, so there is no separate Edit control.
- **R-1.7 (create):** a vendor or visitor who opens the create page gets "Page not found", which is the refusal the criterion asks for.
- **R-8.17 (upload size):** the attachment control says "Any type of file, up to 10 MB each." before a file is chosen, and an oversize upload is refused with a message naming the limit. The ruling could not tell which step read empty, and the re-run that would find out belongs to bind-adapter.
- **R-1.51:** the ruling says the tests never assert it and did not rule on it, so nothing here changes it.

**Not done here:** all five bind-adapter conditions — counting an attachment row with a download link as stored, reporting a missing Publish control for non-administrators as a refusal, editing the draft form in place, reporting "Page not found" for a vendor as a refusal, and re-running R-8.17 to say which step read empty. They concern the adapter at `tests/adapters/new/`, which is outside this stage's paths.

If the remapped adapter still reads these criteria as failing against this same application, the ruling says the next return goes to build. That stage would then start from the application exactly as it was submitted for this ruling.