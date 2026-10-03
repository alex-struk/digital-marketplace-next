---
gate: G3
question: "Does slice 11 (A vendor can register and look after an organization) do what its criteria say?"
recommendation: "This revision fixes the one fault the ruling named: when the organization routes refused someone for lack of permission, the body was keyed `errors`."
opened: 2026-10-03T15:49:35.685Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** This revision fixes the one fault the ruling named: when the organization routes refused someone for lack of permission, the body was keyed `errors`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

This revision fixes the one fault the ruling named: when the organization routes refused someone for lack of permission, the body was keyed `errors`. Those refusals now come back as 401 with the body `{ "permissions": [...] }`. `npm --prefix app run check` passes (typecheck plus every package's unit tests: 16, 534 and 343 tests). R-3.2 and R-3.18 have not been re-run in the acceptance suite; only a new verify run can show them passing.

**The cause.** The organizations service raised each permission refusal as a plain `UnauthorizedException`, and the refusal filter puts those under `errors`. The contract names these refusals "(permissions)" and decision record 0003 makes `permissions` the key. The watch routes already did this through `NamedRefusal`. So the fault was in the application, not in the test adapter as the previous proposal said.

**What changed:**
- **Service** (`app/backend/src/organizations/organizations.service.ts`): a small `notPermitted(message)` helper builds a 401 `NamedRefusal` under `permissions`, the same way `watching.service.ts` does. Registering, changing the profile and archiving now all refuse through it:
  - **Registering** (`POST /api/organizations`): anyone who isn't a signed-in vendor who has accepted the terms, including a visitor.
  - **Changing and archiving** (`PUT` and `DELETE /api/organizations/:id`): anyone who is neither the organization's owner nor a service administrator.
- **Visitors on change and archive:** these two now accept a missing requester and refuse them under `permissions` before looking the organization up.
- **Controller** (`organizations.controller.ts`): `PUT` and `DELETE` now use `readingAccount` instead of `actingAccount`. `actingAccount` was answering a visitor with its own "Sign in to do that." refusal under `errors`, before the service ever ran.
- **Unchanged:** validation refusals (a bad profile, an unknown change tag, an archived or already-archived organization) stay as 400s under `errors`. Reading a single organization and the list of organizations a vendor may act for are not in the ruling and keep their existing `errors` refusal.
- **Frontend** (`app/frontend/src/api/organizations.ts`): the refusal reader now collects reasons from `permissions` as well as `errors`. Without this, a permission refusal would reach the organization screens with no message.

**Tests:**
- `app/backend/tests/organizations-end-to-end.test.ts` starts the real Nest application in-process and calls it over HTTP. It now checks a 401 with exactly `{ permissions: [<message>] }` for:
  - registering, by staff, an administrator, a vendor whose terms acceptance was withdrawn, and a visitor;
  - changing the profile and archiving, by the organization's administrator who is not its owner, an ordinary member, staff and a visitor.

  The existing check that a blank legal name and a malformed email come back under `errors` still passes.
- `app/backend/tests/organizations-service.test.ts` now expects the `permissions` refusal for create, change and archive, and covers a missing requester for change and archive. A new case passes a refusal through the boundary's `refusalFor` to confirm 401 with `permissions` for a permission refusal and 400 with `errors` for a validation one.

The workspace had no installed dependencies, so I ran `npm ci` under `app/` first. It changed no source files.

I touched nothing outside `app/` and added no decision record, because record 0003 already settles the key. If a request test still stops before reaching the service once the key is right, that part belongs to the bind-adapter stage, not this one. The other criteria of the slice (R-3.1, R-3.3, R-3.19 to R-3.22, R-3.24, R-8.13, R-8.21, R-8.28, R-8.30) are as the previous build left them. The team tab and membership changes are still missing for Slice 12.
