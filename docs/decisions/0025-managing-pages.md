# 0025 · Managing pages: who is refused how, what a page request carries, and how an image is referred to

- Status: accepted for the build (slice 5)
- Date: 2026-09-30

## Decision

**One permission refusal for every page request** (R-7.10, R-7.16). Listing pages, creating,
changing and removing one are an administrator's alone. Anybody else — a visitor, a public
sector employee, a vendor — is answered **401** with
`{ "errors": ["Only an administrator may manage pages."] }`, the one refusal shape (decision
record 0010), whatever the request and whatever page it names. The permission check comes
before anything else is looked at, so a request naming a page that does not exist, or a
malformed address, is refused the same way. 401 is what the list of users answers a
non-administrator with (decision record 0024), so the content area and the user area agree.
Reading one page is anybody's (R-7.1) and is never refused for permission.

**Other refusals are 400, in the same shape, naming the field.** A submission failing a field
is refused with one line per failing field, the field named first:
`"Title: Enter a title"`, `"Body: The body is 50,012 characters long. Shorten it to 50,000
characters or fewer."` (R-7.20, R-7.21). An address another page holds is
`"Address: Another page already uses this address. Choose a different one."` (R-7.22), and the
screens recognise that exact line. Renaming or removing a page the service needs is refused
with its own line (R-7.25). A page that is not there is 404. The rules and their wording live
once, in `backend/src/rules/content.ts`, and the form marks fields with the same words.

**A page is changed and removed by its identifier or its address.** The contract types
`PUT`/`DELETE /api/content/{id}` as an identifier; the surface (`content-request`) names the
route `/api/content/:slug`, and reading already falls back from identifier to address (R-7.4).
The boundary is told to accept any string for those two operations (`withAnyPageReference` in
`backend/src/common/contract.ts`), as decision record 0021 did for files; the handler reads the
value the way reading does. The screens send the identifier.

**What a request carries.** `title`, `slug` and `body`, as the contract's `ContentBody` says.
`fixed` is accepted and ignored: whether the service needs a page is set only by migration
(R-7.25 note). On a change, an address left out keeps the page where it is.

**An administrator is told who wrote a page.** `GET /api/content/{id}` answers an
administrator with decision record 0010's page plus `createdBy` and `updatedBy`, each
`{ id, name }` or `null` where no person is recorded (R-7.27). `createdBy` is the page's own
author; `updatedBy` is the author of the current version, not of the page. Anybody else gets
the page without either field. Create and change answer with the same administrator's form;
remove answers with the page as it was.

**Versions.** Every publish adds a version numbered one past the newest, inside one
transaction, and earlier versions are never read by anything (R-7.8, R-7.23). Two publishes
that read the same newest version collide on the version key and the second is answered as a
fault (500), as R-7.28 records; nothing else guards against an overwrite. Removing a page
removes its versions in the same transaction (R-7.9).

**The list's order** is by title compared as a reader would (`localeCompare` in English), then
by address, so `about` and `About us` sit together (R-7.5).

**The content area is the not-found screen for anybody but an administrator**, a visitor
included: R-7.6 says "anybody else", so a visitor is not sent to sign in first, as the user
list does. The navigation menu offers "Content" to an administrator alone.

**An image in a body is the marker `@file/<identifier>`** (R-8.29), written by the editor as
`![Describe this image](@file/<identifier>)` at the cursor, with the description selected so it
can be typed over. The renderer turns a marker naming a well-formed identifier into
`/api/files/<identifier>?type=blob` when the text is displayed; anything else is left as written
(`resolveEmbeddedFile` in `backend/src/rules/files.ts`). The image is uploaded through
`POST /api/files` as soon as it is chosen, readable by anyone (`[{"tag":"any"}]`). The editor
refuses a file over 10 MB, or one whose first bytes are not a JPEG or PNG, before sending it.

**Two design-system details the stories do not show.** The stories give `InlineAlert` both a
`title` and children; version 0.8.1 drops the title when there are children, so the screens use
a small wrapper (`frontend/src/app/titled-alert.tsx`) that puts the title in the alert's title
slot. And what a screen says on arrival — "Page published", "Changes published", "Page
removed" — travels in the history entry's state, so it is said once, on the screen the person
is taken to (design gap 3).

## Why

- R-7.16 asks for the same shape for every page refusal; one status and one message is the
  simplest thing that is plainly the same, and the check-first order makes it hold whatever
  else is wrong with the request.
- A refusal read directly has to say which field failed (R-7.20), and a screen has to tell an
  address clash apart from any other refusal without a second shape.
- The acceptance surface addresses pages by their address throughout; refusing those requests
  at the boundary as malformed would answer a permission question with a format one.

## What would reverse it

- A ruling that a permission refusal is 403 (or 404, so as not to reveal the area): one
  exception class in `ContentService.mustManage`, and the same ruling should reach the user list.
- A ruling that an address clash is 409: one line in `ContentService.asRefusal`.
- The contract gaining response schemas for pages, which would make the authorship fields part
  of it rather than of this record.

## What a reader should know

- A page whose address is `create` can be read at `/content/create` by nobody, because that
  address is the create screen's; its managing screen at `/content/create/edit` still works.
  The old application had the same shadowing.
- A fresh installation and a seeded sandbox both carry the twenty-two needed pages
  `tests/seed/000-installation.sql` restores. The seeded sandbox also has the seed's four
  ordinary pages. The service level agreement page is answered by the service, not stored
  (decision record 0026; this replaces the earlier count of twenty-three).
