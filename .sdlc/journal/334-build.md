---
stage: "build"
title: "build slice 3"
at: "2026-10-01T00:21:35.137Z"
cost: 15.888657200000006
turns: 242
session: "b9e7a85a-8b0a-446f-a1a1-7430051f034f"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I built slice 3: profiles, the profile picture, the notification choice with its unsubscribe landing, self-deactivation and reactivation, and the file store underneath. All 32 assigned criteria are built. `npm --prefix app run check` passes: 15 migration tests, 240 backend tests and 127 frontend tests. I could not start the compose stack, because `docker compose up` needs an approval and nobody was here to give it. Nothing has been checked in a running sandbox; the unit and in-process tests are the only evidence.

**The file store (R-8.1, 8.2, 8.5–8.7, 8.10–8.13, 8.16–8.18, 8.21, 8.23, 8.24, 8.28, 8.30)**
- A new migration adds the old application's three read-access tables (public, one named person, one kind of account), only where they don't already exist. I re-pulled the Prisma schema afterwards.
- `POST /api/files` and `POST /api/avatars` read the upload themselves rather than letting the contract validator read it. The file goes into a working directory (`FILE_UPLOADS_DIR`, a tmpfs in compose standing in for the `emptyDir` volume) and is removed after every answer, success or refusal.
- Identical content is stored once, keyed by a SHA-256 fingerprint; each upload still gets its own record with its own read access.
- Refusals and their statuses:

| Upload | Answer |
| --- | --- |
| From a visitor | 401 |
| No file part | 400, says so |
| Read-access information missing, malformed or unknown | 400, "The read-access information provided was invalid…" |
| File over 10 MB | 413, message names the limit |
| Name over 255 characters | 400, names the length rule |
| Picture not named .jpg/.jpeg/.png, or not really a JPEG/PNG | 400 |

- Pictures are always readable by anyone. They are shrunk to fit 500 pixels in plain JavaScript (no native image library), and kept at their own size if shrinking fails.
- `GET /api/files/{id}` returns `{id, name, createdAt, fileBlob}` and never the uploader. `?type=blob` returns the bytes as a download, typed by the file name's ending.
- A file you may not read, a missing file and a malformed identifier all get 401; only an administrator gets 404 for a missing one. For that I loosened the contract adapter so this one route accepts any identifier string.
- There is a slot for "readable through what it's attached to" (R-8.20), left empty for slices 7 and 14 to fill.

**Accounts and profile (R-4.5, 4.6, 4.8, 4.9, 4.18, 4.25–4.29, 4.33, 4.34)**
- `GET /api/users/{id}` answers the person or an administrator and refuses everyone else with 401.
- Every change goes through `PUT` on your own account only; anyone else gets 403, administrators included. The profile edit now takes a picture, which must be a file you can read. A new capabilities edit is vendor-only and accepts only the nine names the seed uses.
- `DELETE /api/users/{id}` on yourself marks the account as deactivated by you, with the date, and sends an email. It ends the session at the service and the identity provider, the same way signing out does; I moved that logic into a shared piece both now use.
- Your next sign-in reactivates the account and sends the "successfully reactivated" email. The deactivation date is kept, as the old application kept it.

**Screens**
- The profile screen is rebuilt from the stories with all their test IDs:
  - which sections each kind of account sees
  - the edit form with error summary and save failure
  - the picture picker, which states its rules before you choose a file
  - capabilities that save as you tick them, with expandable descriptions
  - a placeholder Organizations section
  - the notifications choice
  - the deactivate dialog
- An administrator viewing someone else's profile sees the profile section alone, read-only; anyone else sees the missing page.
- Following the unsubscribe link (`?tab=notifications&unsubscribe`) always asks the question, naming the signed-in person's address, even if their notices are already off. A visitor is sent to sign in with a "Sign in to unsubscribe" notice.
- The picker is also wired into the profile-completion page, which slice 2 had left storing nothing.

**Email (R-6.6, 6.7, 6.16)**
- Every message now ends with a settings link that carries nothing about the recipient. Only messages marked as governed by the notice choice say "Unsubscribe"; all others say "Manage your notification settings".
- This follows the plan's reading that R-6.16 narrows R-6.6. The only governed message, the new-opportunity announcement, is slice 7's, so no message sent in this slice offers to unsubscribe. A test reading R-6.6 literally against the welcome email would fail.

**Tests I added**
- Shared-rule unit tests (file names, read-access parsing, who may read, picture sizes, content types, email footer, capabilities, profile sections).
- A whole-application test over a real migrated database (in-process Postgres) covering every upload refusal, reading rules, deduplication, downloads, picture resizing, profile reads and edits, and deactivate-then-sign-in-again.
- Screen tests for the profile, picker, capabilities, unsubscribe and deactivation, plus the download helper.
- I changed the four database-backed test files to ask the system for a free port. Port 55434 turned out to be held, invisibly, by the Windows side of this machine, and a fixed port could fail `check` for the runner the same way.

**Decisions recorded:** 0021 (file store, statuses and messages), 0022 (unsubscribe link only on governed messages), 0023 (the profile in this slice, replacing slice 2's read-only version in 0016).

**Left for the next slices**
- **Slice 4:** an administrator's controls on someone else's profile (the administrator box, deactivate, reactivate). Deactivating someone else currently returns 403.
- **Slice 6:** the "terms updated" warning and agreeing again on the legal section.
- **Slices 7 and 14:** marking the new-opportunity announcement as governed by the notice choice, the attachment-based read rule, and the attach-by-identifier check.
- **Slices 11 and 12:** the Organizations section.
- **Content to replace:** the capability descriptions and the privacy wording on the legal section are my own, because the specification does not carry the originals.
- **Open ruling, not mine:** R-8.12 (whether a missing file should be "not found" or "not authorized") is still open. I built it as written: 401, except 404 for an administrator.
- **Gap in R-8.23:** it still points to the superseded R-8.4. I answer an upload with no name as a 400 rather than a service fault.

I left `spec/`, `plan/`, `design/` and `tests/seed/` untouched. I also removed the `node_modules` and build output I had created, since there is no ignore file and they weren't there when I started; the runner will need to install dependencies before `check`.