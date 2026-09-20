# 0010 · What the service answers with, where the contract does not say

- Status: accepted for the build (slice 1)
- Date: 2026-09-20

## Decision

`spec/contract/openapi.yaml` is the source of the API surface — every address, method and
parameter (0003, the stack profile). What it does not carry is response bodies: the thirteen
partial documents it was recovered from describe statuses and a sentence apiece, and for
pages they say nothing at all. Two shapes are therefore the rebuild's, and are fixed here so
that later slices and the acceptance harness do not each invent one.

**A page** (`GET /api/content/{id}`) answers with the record the kept schema holds, flattened
across the page and its current version:

```json
{
  "id": "00000000-0000-4000-8000-000000000501",
  "createdAt": "2026-01-05T17:00:00.000Z",
  "updatedAt": "2026-01-07T17:00:00.000Z",
  "slug": "about-us",
  "title": "About us",
  "body": "The current wording, as marked-up text.",
  "fixed": false
}
```

`createdAt` is when the page was first published and `updatedAt` when its wording last
changed (R-7.1). `body` is the marked-up text as stored; turning it into formatted text is
the reader's side of the service (0009). No authorship is carried: that is for an
administrator on the managing screen (R-7.27), and the slice that builds it adds the fields.

**A refusal** is a status and a list of reasons, in one shape for every refusal the service
makes, whatever caused it:

```json
{ "errors": ["No page is held at that address."] }
```

The boundary validator's own refusals are given the same shape, so nothing reading the
service's answers has to tell a refusal from the contract layer apart from a refusal from a
handler by its shape. A fault says only that there was one; the detail goes to the
operational log and never to the person who asked.

## What this means for validation at the boundary

Every **request** is validated against the contract, in one place, before it reaches a
handler: an address the contract does not carry answers as nothing, and so does a parameter
it does not name (`app/backend/src/main.ts`, `app/backend/tests/boundary.test.ts`).

**Answers are not validated against it**, because there is nothing there to validate them
against. A validator reads an operation with no declared content as one whose answer must be
empty, so with this contract every correct answer is reported as a violation — including the
one whose own description reads "Receive the page, its body, and its published and updated
dates". Turning it on would drown the operational log in false alarms and teach everyone to
ignore it. The day the contract carries response schemas, one line in `main.ts` turns it back
on.

## Why

- `spec/contract/observables.yaml` has a whole section on refusals whose point is that two
  refusals can be compared. That needs one shape, decided once.
- R-7.16 — a permission refusal reported in the same shape as every other page refusal — is
  slice 5's to demonstrate, but it can only hold if the shape exists before anything refuses
  anybody. It does now.
- Flattening the page over its current version is what every screen wants and what the kept
  schema makes awkward; doing it once, at the boundary, keeps the version table out of the
  browser.

## What would reverse it

- A recovered document, or the old application, showing the old service answered with a
  different shape. The screens would not change; the acceptance suite's API-level steps
  would.
- A criterion about what an answer carries — an authorship field, a reason code — which
  extends this rather than replacing it.
