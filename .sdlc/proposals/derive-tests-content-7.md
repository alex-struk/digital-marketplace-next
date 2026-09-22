---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I made one change, and only one."
opened: 2026-09-22T03:28:54.137Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I made one change, and only one.

I made one change, and only one.

**Condition 1 (build-slice-1-4, R-7.17).** The ruling asked me to re-word the not-testable reason so that the never-executed clause is recorded against the thing that is actually missing — a stored page body with markup in it — rather than against `content-view` supposedly being unable to tell an executed body from a stripped one. I checked first whether the seed request it mentions had landed: `tests/seed/003-content.sql` and the generated `seed.ts` both still carry `content.ordinaryPage` as the sole page, whose current body is "The third and current version of this page, with a **formatted** word in it." There is no body with markup anywhere in the seed and no second content handle. So the clause still has nothing to be read against, and I derived no test for it; had the body landed, this would have been a spec file rather than an entry.

What I did change is the reason text for `R-7.17` in `tests/acceptance/not-testable.yaml`. It now says that `page_body` *would* separate the two renderings once a body holds markup — the markup comes back as a string when it reaches the reader as text and does not when it is executed or stripped, and a renderer that strips it fails the formatted-text clause too — and that what the suite lacks is such a body in the seed, named with the existing handle and its current wording so the gap is concrete. The unblocking note is now split in two: a seeded page body embedding markup, under a handle of its own, for the first clause; and, unchanged in substance, a seed handle for one of the pages another screen embeds plus an observation of that embedded rendering for the second. The second clause's own reasoning — that nothing embeds an authorable body, because the terms and evaluation-instructions screens embed pages the service makes for itself, which the seed does not name and no surface addresses by handle — I left as it stood, as the ruling said it should. The entry stays `blocked:` and stays at version 1.

Nothing else moved. No spec file under `tests/acceptance/content/` was written, deleted or re-dated; no other entry in `not-testable.yaml` was touched; `tests/generated` is as its setup step produced it. I read `spec/`, `tests/seed/` and `tests/generated/surface.d.ts` only to decide the above, and wrote to none of them.

One thing worth passing to whoever writes the contract next, since it bears on how this gap gets closed: `content-create` does offer `enterBody` and `publishPage`, and `content-view` offers `pageBody`, so a body with markup could in principle be authored by a test rather than seeded. I did not take that route, because the ruling names the seed as where this gap should be recorded and closed, and because a body typed into the create form is not obviously the same thing as a stored body the criterion speaks of — the form may normalise what it accepts. If the seed request is judged the wrong home for it, the create-then-view route is the alternative and would need no new surface at all. Beyond that, no surface action or observation was needed and missing for this condition.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The revision does exactly what the prior ruling asked and nothing else. The never-executed clause's reason is re-worded to record the absent seeded body rather than a supposed inability of content-view to distinguish the two renderings, and that re-diagnosis is verified correct on the branch: tests/acceptance/content/R-7.1.spec.ts:19 already reads contentView.pageBody() and asserts not.toContain("**"), so the observation does discriminate markup-shown-as-text from markup-executed-or-stripped. The seed claim is verified exact: tests/seed/003-content.sql and tests/generated/seed.ts hold one content handle, content.ordinaryPage, whose body is quoted verbatim in the reason and embeds no executable markup, and there is no second handle. The unblocking note is split so each clause names its own concrete gap; the second clause's reasoning is left as directed. No test was derived for a clause with nothing to read against, which is right. Scope is confined to the one not-testable entry (plus .sdlc bookkeeping): no spec under tests/acceptance/content/ was written, deleted or re-dated, R-7.17 has no spec file anywhere, no other YAML entry moved, tests/generated is untouched, the entry stays blocked: at v1, and typecheck reports no diagnostics under acceptance/content/. The proposal's flagged alternative (content-create.enterBody plus content-view.pageBody, both of which exist in the generated surface) is a genuine contract question passed to the right stage rather than a defect here. build-slice-1-4#1 is addressed to build, concerns that slice's account and files under app/frontend/tests/ that derive-tests cannot write, and remains open for the next build ruling; the stale and superseded-criterion warnings under evaluation, files and notifications are pre-existing and belong to those domains' own runs.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `c1a7da9fb58b27d1269ff5837338984066117883`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
