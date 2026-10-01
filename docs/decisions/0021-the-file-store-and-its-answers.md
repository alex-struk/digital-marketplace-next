# 0021 · The file store: what uploads carry, how they are refused, and what reads answer with

- Status: accepted for the build (slice 3)
- Date: 2026-09-30

## Decision

**Uploads are read by their handler, not by the boundary validator.** `POST /api/files` and
`POST /api/avatars` are multipart forms. The validator is told to leave those two addresses
alone (`ignorePaths`, and its own multipart reader is off), and the handler reads the
submission itself, streaming the first file part into the upload working directory
(`FILE_UPLOADS_DIR`; the backend's `emptyDir` volume in a sandbox, a tmpfs in compose). It
then checks the submission against what the contract's `FileUpload` says it carries — a
`name`, a `metadata` read-access statement and a `file` — and removes the working copy once
the upload has been answered, whether it was stored or refused (R-8.16, R-8.18). Every other
request is still validated at the boundary as before (decision record 0010).

Why: the validator would read the whole submission into memory, and the criteria want each
malformed upload refused as the requester's error, in words that name what was wrong (R-8.17,
R-8.18, R-8.23, R-8.24). The validator's own refusals are worded for the contract, not for the
person.

**What an upload carries.** `metadata` is JSON: one statement or a list of them, each
`{"tag":"any"}`, `{"tag":"user","value":<account id>}` or
`{"tag":"userType","value":"VENDOR"|"GOV"|"ADMIN"}`, as the old application sent it. An empty
list records no read access at all, which is what an attachment needs (R-8.19). Repeats are
reduced to one. Only the first file part is kept; other parts and fields are passed over.

**How an upload is refused** (always in decision record 0010's shape):

| The submission | Status | Message |
| --- | --- | --- |
| from a visitor | 401 | "Sign in to do that." |
| no file part, or not a multipart form | 400 | names the missing file |
| read-access information missing, not well-formed, or naming an unknown kind | 400 | begins "The read-access information provided was invalid", then says which |
| a file over 10 MB | 413 | "The file is larger than 10 MB. Upload a file of 10 MB or smaller." |
| a name that is empty or over 255 characters | 400 | "The file name must be between 1 and 255 characters long." |
| a picture whose name does not end in .jpg, .jpeg or .png | 400 | says so |
| a picture whose content is neither a JPEG nor a PNG | 400 | says so |

413 rather than 400 for size: it is the requester's error (R-8.17) and the one status that says
which. An upload that declares no size is not refused for that alone (R-8.3, which refused it,
was superseded by R-8.17, which says nothing about it); its file is still held to the limit as
it arrives. An upload with no `name` at all is refused with the name-length message: R-8.23
still says it "fails as the service fault described by R-8.4", but R-8.4 is superseded by
R-8.18, which forbids answering a requester's mistake as a fault.

**Pictures.** `/api/avatars` stores what it is given as readable by anyone, whatever its
`metadata` says (R-8.28). Its content must decode as a JPEG or PNG (R-8.21); one wider than 500
pixels is narrowed to 500, then one still taller than 500 is shortened to 500, keeping its
proportions, and it is stored in the format it came in (R-8.13). One that decodes but cannot be
re-encoded is stored at its own size. The image work is plain JavaScript (`jpeg-js`, `pngjs`),
so the service's image has no native library to build.

**What a read answers with.** `GET /api/files/{id}` answers with the file's description —
`{ id, name, createdAt, fileBlob }`, `fileBlob` being a sha256 digest of the content that two
identical uploads share (R-8.5, R-8.11). Who uploaded it is recorded and never answered.
`?type=blob` answers with the bytes, typed by the name's ending alone and offered as an
attachment under the stored name (R-8.10). A file the requester may not read, and an
identifier no file carries or that is not well formed, are both 401; an administrator is told
404 for a missing one (R-8.12, read as written; the open question it records is not decided
here). So that a malformed identifier gets that answer and not a 400, the boundary accepts any
string as `/api/files/{id}`'s identifier; nothing else about the route is relaxed.

**Read access** is the old schema's three tables, `filePermissionsPublic`, `filePermissionsUser`
and `filePermissionsUserType` (migration `20260930000004_file_permissions`, created only where
absent), plus the uploader and any administrator (R-8.7). What a file is attached to can also
make it readable (R-8.20): `FILE_READ_PATHS` is a list each later slice that attaches files adds
a read path to. It is empty in slice 3.

## What would reverse it

- A ruling on R-8.12 that a missing file is "not found" for everyone, or "not authorized" for
  everyone; one line of `FilesService.read` changes.
- A ruling that an oversized upload is answered 400; one exception class changes.
- The contract gaining a schema the validator can check a multipart body against in the
  criteria's own words, at which point the exception in `application.ts` can go.
