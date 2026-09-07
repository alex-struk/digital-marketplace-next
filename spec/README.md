# The criterion format

A criterion is what the system must do, stated once, in one place. This directory holds one
Markdown file per business domain — `spec/domains/<domain>.md`, where `<domain>` is one of the
names in `.sdlc/config.yaml`'s `project.domains` — and each file is a sequence of criterion
blocks. Nothing else lives under `spec/domains/`.

`spec/criteria-index.json` and `spec/spec.md` are generated from these files by `sdlc run
ratify`. Do not edit either by hand; edit the domain file and re-run ratify.

A domain file may open with a `#`/`##` title or a line or two of prose before its first `### `
block; that text is ignored. Once the first `### ` line has been seen, the format is strict again.

## One block

```
### D-permits-1 · v1 · inferred · recovered
When an applicant submits a completed permit application, its status shall change to
"Under review" and the assigned reviewer shall be notified.
- cites: src/lib/permits/application.ts:88
- reconciliation: implemented-only
- given: a permit application with all required fields completed
- when: the applicant submits it
- then: the application's status changes to "Under review" and the assigned reviewer receives a notification
- note: the old system logs this transition but has no automated test for it
```

## The heading

```
### <ID> · v<version> · <confidence> · <origin>
```

- **`<ID>`** is either `D-<domain>-<n>` — a provisional ID, minted by archaeology or written by
  hand, not yet ratified — or `R-<domain-number>.<n>` — a permanent ID, minted only by `sdlc run
  ratify`. The domain segment of a `D-` ID must match the file it lives in.
- **`<version>`** is an integer starting at 1, incremented whenever the criterion's meaning
  changes (correcting a typo does not need a new version; changing what "under review" means
  does).
- **`<confidence>`** is one of `confirmed`, `inferred`, `open`. A criterion never ratifies while
  it is still `inferred` or `open`.
- **`<origin>`** is `recovered` (found in an existing application) or `authored` (written new, no
  prior system to point at).
- The separator between the four fields is the middle dot `·` (U+00B7), with exactly one space on
  each side. A plain hyphen surrounded by exactly one space on each side (` - `) is also accepted.

## The body

The first non-empty, non-bullet line (and any further non-bullet lines before the first bullet)
is the statement: one sentence, technology-free, stating what the system does and for whom.

After the statement, bullet lines carry everything else. Each is `- key: value`; an unknown key is
a parse error, and so is a second occurrence of a key that does not repeat (`reconciliation`,
`state`, `tier`, `replaces`, `superseded-by` — see the "Repeats" column below).

| Key | Value | Repeats |
| --- | --- | --- |
| `cites` | `<path>` or `<path>:<line>`, relative to the old application's checkout (`sources/old`) | yes, once per citation |
| `reconciliation` | `aligned` \| `implemented-only` \| `documented-only` \| `conflicting` \| `defect` | no |
| `given` | the starting condition | yes — repeats join with " and " |
| `when` | the triggering action | yes — repeats join with " and " |
| `then` | the observable outcome | yes — repeats join with " and " |
| `note` | free text; anything worth recording that has no other field | yes — every note is kept |
| `state` | `proposed` \| `accepted` \| `implemented` \| `verified` \| `monitored` \| `obsolete` (default `proposed`) | no |
| `tier` | `LOW` \| `STANDARD` \| `HIGH` \| `CRITICAL` | no |
| `replaces` | the ID of a criterion this one supersedes | no |
| `superseded-by` | the ID of the criterion that replaced this one | no |

`reconciliation`, `state` and `tier` are closed vocabularies: a value outside the list above is a
parse error, exactly like an unknown key.

A `recovered` criterion needs at least one `cites`, since a claim about what the old application
does has to point at where. A `defect` reconciliation — the old application does something the
spec says it should not — needs either a `replaces` (the ID of the corrected criterion) or at
least one `note`; any note satisfies it, there is no required wording.
