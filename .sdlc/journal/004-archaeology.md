---
stage: "archaeology"
title: "archaeology: post-checks failed"
at: "2026-09-07T00:43:21.428Z"
cost: 0
turns: 0
session: ""
---

I've finished. Here is my journal entry.

---

## What the opportunities domain does

The opportunities domain is where a public sector employee writes up a piece of procurement work, gets it approved and published, and then walks it through evaluation to an award. It covers three programs — Code With Us (a fixed-price posting for a single deliverable, capped at $70,000), Sprint With Us (an agile team engagement in phases, capped at $5,000,000) and Team With Us (individual resources drawn from five named service areas, billed on time and materials) — which share one lifecycle skeleton but differ in their fields, their evaluation stages and their scoring rules. An opportunity is never overwritten: each edit writes a new version, and a parallel chain of status and event records is what the history page reads, so who changed what and when survives publication.

The recovered rules fall into four groups: **who can see it** (anonymous visitors and vendors get public statuses only; a public sector employee also gets their own drafts; an administrator gets everything; on the two newer programs an evaluation panel member also gets the unpublished opportunity they are assigned to), **who can move it** (creation is open to any public sector employee, but publication and cancellation are administrator-only — an ordinary author submits for review instead), **what makes a submission valid** (field lengths, a date chain that must run deadline → assignment → start → completion with everything pinned to 4pm Pacific, at least one skill, scoring weights summing to exactly 100 percent, an evaluation panel of at least two public sector employees with at most one chair), and **what happens without anyone acting** (a lapsed deadline moves the opportunity into evaluation and its submitted proposals into review; a fully-scored evaluation moves it to processing; awarding a proposal moves it to awarded and marks the rest not awarded).

I wrote 56 criteria to `spec/domains/opportunities.md`, appended 14 pages to `spec/contract/surface.yaml` under `domain: opportunities`, and added six roles to `spec/contract/personas.yaml`.

## What conflicted between the sources

The shipped prose is a version or two behind the shipped code, consistently in the same direction — it predates Team With Us. The README describes the service as administering two programs; `docs/database-schema.md` documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files for Code With Us and Sprint With Us opportunities but none for Team With Us, even though that resource is registered in the router alongside the other two. The Code With Us OpenAPI file also documents only two creatable statuses (draft and published) and four update actions, where the code has accepted under-review since a 2023 migration and offers six actions. And it says deletion "will fail if the Opportunity is not in Draft or has previously been published" — the code never looks at whether an opportunity was previously published, only at its current status, and it additionally lets an administrator delete an under-review opportunity.

Two conflicts are internal to the code rather than between code and docs, and those are the more interesting ones. The first is about editing a published opportunity: the front-end withholds the edit unless the viewer is an administrator, while the permission the request is actually checked against allows the opportunity's public sector author too. The restriction is presentational only, and I could not determine which layer states the intent, so I recorded it as `open` / `conflicting` rather than picking a side. The second is the three programs disagreeing with each other about creation: Sprint With Us and Team With Us both refuse a non-administrator who asks to create an opportunity directly in the published status, and Code With Us does not check the status at all — so a Code With Us opportunity can be created as published by someone who would be refused if they tried to publish that same opportunity a second later. The interface never offers it, so it is reachable only by calling the API directly.

## What I could not determine

Three things I deliberately left open rather than resolving:

Whether the divergences between programs are intent or drift. Team With Us has no upper bound on its maximum budget where the other two are capped; its history records carry no attachments where the others do; its transition table omits processing-to-awarded, which awarding bypasses anyway by writing the status directly; and its delete permission checks no status, so an author can delete their own opportunity after submitting it for review, which the other two forbid. Each of these is a single-program difference with no comment, no migration note and no documentation explaining it. Read one way they are three deliberate product choices; read another they are an unfinished port of the newest program. The code cannot settle it and I did not guess — they are recorded as `defect` or carry a `note` saying a human has to rule.

Why the listing's status filter is missing two of its statuses. It offers draft, under review, published, evaluation and awarded — so a cancelled or processing opportunity vanishes the moment any status filter is applied. I could not tell whether the fix is to add the two missing choices or to change what the existing choices match, so I wrote no replacement criterion.

The intended timing of the deadline transition. It is not a scheduled job. It runs as a throttled hook before handling an incoming request, and it is deliberately attached to the status endpoint so a health probe keeps it firing when nothing else does. On an idle system an opportunity stays published past its deadline. Whether that is acceptable behaviour to carry forward or an artefact of not having a scheduler available is a product question, and I flagged it as one because a scheduled job and a request hook are not observationally equivalent under low traffic.

One process note for whoever runs this stage next: the instructions point at `spec/README.md` for the exact criterion grammar, and no such file exists in the repository. I wrote against the format declared at the top of `spec/spec.md` instead, extended with the `origin` / `cites` / `reconciliation` / given-when-then fields this stage is required to record, and said so in a header block at the top of the domain file. If a checker is validating against a grammar defined somewhere I could not see, that file is the thing to reconcile first.

spec/domains/opportunities.md:27: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: The system shall publish procurement opportunities under exactly three programs — Code With
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: Us, Sprint With Us and Team With Us — each with its own creation form, its own detail page
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: and its own set of statuses.
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:77
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:105
spec/domains/opportunities.md:34: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:160
spec/domains/opportunities.md:35: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: aligned
spec/domains/opportunities.md:37: expected a heading (### ID · vN · confidence · origin), got: - given: a visitor on the "create an opportunity" page
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: - when: the page is displayed
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: - then: three programs are offered, each with a guide link and a "get started" link to its
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got:   own creation form
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: - note: the shipped prose disagrees with the shipped code. `README.md:5` describes the
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got:   service as administering "Code With Us and Sprint With Us"; `docs/database-schema.md`
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got:   documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got:   for the Code With Us and Sprint With Us opportunity endpoints but none for Team With Us,
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got:   although the Team With Us resource is registered in the router. Three programs is what the
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got:   code does; the documentation is stale on all three counts.
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-2 (v1) [confidence: inferred]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall record an opportunity as a chain of immutable versions with a separate
spec/domains/opportunities.md:50: expected a heading (### ID · vN · confidence · origin), got: chain of status and event records, so that every change to a published opportunity leaves a
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: history entry rather than overwriting the previous content.
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: - cites: docs/database-schema.md:156
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity that has been edited twice
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens its history
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: - then: the history shows one entry per edit, in addition to the entries for each status
spec/domains/opportunities.md:59: expected a heading (### ID · vN · confidence · origin), got:   change, and the opportunity displays the most recent version's content
spec/domains/opportunities.md:61: malformed heading: ### D-opportunities-3 (v1) [confidence: inferred]
spec/domains/opportunities.md:62: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has never been given a title as "Untitled" in
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: listings and headings.
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:150
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with an empty title
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: - when: its author opens the opportunity listing
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity appears with the title "Untitled"
spec/domains/opportunities.md:72: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:74: expected a heading (### ID · vN · confidence · origin), got: ## Who may see what
spec/domains/opportunities.md:76: malformed heading: ### D-opportunities-4 (v1) [confidence: confirmed]
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public status,
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: both in the listing and when a single opportunity is requested by its identifier.
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:84: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity and a published opportunity
spec/domains/opportunities.md:85: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor opens the opportunity listing, and then requests the draft
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got:   opportunity's address directly
spec/domains/opportunities.md:87: expected a heading (### ID · vN · confidence · origin), got: - then: the listing shows only the published opportunity, and the direct request is answered
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got:   as not found
spec/domains/opportunities.md:90: malformed heading: ### D-opportunities-5 (v1) [confidence: confirmed]
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every opportunity in a public status plus the
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: unpublished opportunities they authored, and no other unpublished opportunity.
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:98: expected a heading (### ID · vN · confidence · origin), got: - given: two public sector employees, each with one draft opportunity
spec/domains/opportunities.md:99: expected a heading (### ID · vN · confidence · origin), got: - when: the first opens the opportunity listing
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: - then: their own draft is listed and the other employee's draft is not
spec/domains/opportunities.md:102: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: The system shall show an administrator every opportunity regardless of status.
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:406
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:626
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: - given: draft opportunities authored by several different public sector employees
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens the opportunity listing
spec/domains/opportunities.md:110: expected a heading (### ID · vN · confidence · origin), got: - then: all of them are listed
spec/domains/opportunities.md:112: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:113: expected a heading (### ID · vN · confidence · origin), got: For Sprint With Us and Team With Us, the system shall additionally let a member of an
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: opportunity's evaluation panel open that opportunity while it is still unpublished, even
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: when they did not author it.
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: - given: a draft Sprint With Us opportunity whose evaluation panel includes a public sector
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got:   employee who is not its author
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: - when: that panel member requests the opportunity
spec/domains/opportunities.md:122: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is shown to them
spec/domains/opportunities.md:123: expected a heading (### ID · vN · confidence · origin), got: - note: Code With Us has no evaluation panel and so no equivalent rule.
spec/domains/opportunities.md:125: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: The system shall offer a way to list only the opportunities on whose evaluation panel the
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: requesting public sector employee sits, and when that view is requested it shall exclude
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: every other opportunity, including public ones.
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: - given: a panel member who also authored an unrelated published opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: - when: they request the panel-member view of the listing
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: - then: only the opportunities they sit on a panel for are returned
spec/domains/opportunities.md:137: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:138: expected a heading (### ID · vN · confidence · origin), got: The system shall withhold the identity of an opportunity's author and last editor from every
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: viewer except an administrator, the author, and the last editor.
spec/domains/opportunities.md:140: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor views it
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: - then: no author or editor name is shown
spec/domains/opportunities.md:147: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:148: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's change history only to an administrator or the
spec/domains/opportunities.md:149: expected a heading (### ID · vN · confidence · origin), got: opportunity's author.
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:151: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:478
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with several status changes
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor and then the author view it
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: - then: the vendor sees no history and the author sees the full list of status changes and
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got:   events
spec/domains/opportunities.md:158: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's reporting figures — number of views, number of
spec/domains/opportunities.md:160: expected a heading (### ID · vN · confidence · origin), got: watchers, number of submitted proposals — only to an administrator or the author, and only
spec/domains/opportunities.md:161: expected a heading (### ID · vN · confidence · origin), got: once the opportunity has reached a public status.
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:163: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with two submitted proposals
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: - when: the author views it
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: - then: the view count, watcher count and proposal count are shown; a vendor viewing the
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got:   same opportunity sees none of them
spec/domains/opportunities.md:170: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: The system shall count one additional view of an opportunity each time its detail page is
spec/domains/opportunities.md:172: expected a heading (### ID · vN · confidence · origin), got: opened.
spec/domains/opportunities.md:173: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:175: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/counter.ts
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose reported view count is a known number
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: - when: any visitor opens its detail page
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: - then: the view count reported to the author increases by one
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: ## Listing, sorting and filtering
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity listing into three sections — unpublished, open and
spec/domains/opportunities.md:187: expected a heading (### ID · vN · confidence · origin), got: closed — where open means published with a proposal deadline still in the future, closed
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: means published-or-later with the deadline passed or the opportunity no longer accepting
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: proposals, and unpublished means draft or under review.
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: - given: one draft, one published opportunity with a future deadline, and one awarded
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got:   opportunity
spec/domains/opportunities.md:196: expected a heading (### ID · vN · confidence · origin), got: - when: the author opens the listing
spec/domains/opportunities.md:197: expected a heading (### ID · vN · confidence · origin), got: - then: each appears in the unpublished, open and closed section respectively
spec/domains/opportunities.md:199: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: The system shall order open opportunities by soonest proposal deadline first, closed
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: opportunities by most recently passed deadline first, and unpublished opportunities by most
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: recently changed first.
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:194
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: - given: three open opportunities with deadlines a week apart
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor opens the listing
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: - then: they appear in ascending order of deadline
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall let a visitor narrow the opportunity listing by program, by status, to
spec/domains/opportunities.md:212: expected a heading (### ID · vN · confidence · origin), got: remote-friendly opportunities only, and by a text search matched against title and location.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: - given: opportunities across all three programs, some remote-friendly
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects the Code With Us program and ticks the remote-only option
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: - then: only remote-friendly Code With Us opportunities remain listed
spec/domains/opportunities.md:221: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: The status filter on the opportunity listing shall offer a choice for every status an
spec/domains/opportunities.md:223: expected a heading (### ID · vN · confidence · origin), got: opportunity can hold.
spec/domains/opportunities.md:224: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:60
spec/domains/opportunities.md:226: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:346
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity and an opportunity in the processing status
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects any value in the status filter
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: - then: neither opportunity can be brought back into view by any filter choice, because the
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got:   filter offers only draft, under review, published, evaluation and awarded
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: - note: this is written as the intended behaviour, not as the recovered behaviour. The
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got:   recovered behaviour is that cancelled and processing opportunities are silently excluded
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got:   whenever a status filter is applied. There is no replacement criterion because whether the
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got:   fix is to add the two missing choices or to change what the existing choices match is a
spec/domains/opportunities.md:236: expected a heading (### ID · vN · confidence · origin), got:   product decision, not something the code settles.
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: ## Creating an opportunity
spec/domains/opportunities.md:242: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator or a public sector employee to create an
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: opportunity, and shall refuse the attempt for a vendor or an anonymous visitor.
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:247: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:75
spec/domains/opportunities.md:248: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor
spec/domains/opportunities.md:250: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to create an opportunity
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused and no opportunity is created
spec/domains/opportunities.md:253: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is saved as a draft, the system shall accept it without checking any
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: field other than its attachments, and shall stand in a date fourteen days from now wherever
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: a required date is missing or invalid.
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:258: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:259: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee filling in the creation form
spec/domains/opportunities.md:261: expected a heading (### ID · vN · confidence · origin), got: - when: they save a draft with no title, no description and no dates
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: - then: the draft is created, and its proposal, assignment and start dates are set two weeks
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got:   from today
spec/domains/opportunities.md:265: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review or published rather than saved as a draft, the
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: system shall reject it unless every required field is valid, and shall say which fields are
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: at fault.
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:276
spec/domains/opportunities.md:271: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:272: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity form with an empty description
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: - when: the author submits it for review
spec/domains/opportunities.md:274: expected a heading (### ID · vN · confidence · origin), got: - then: the submission is rejected and the description field is reported as invalid
spec/domains/opportunities.md:276: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity whose title is empty or longer than 200 characters,
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: whose teaser is longer than 500 characters, whose description is empty or longer than 10,000
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: characters, or whose location is empty.
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:89
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:137
spec/domains/opportunities.md:283: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:147
spec/domains/opportunities.md:284: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:286: expected a heading (### ID · vN · confidence · origin), got: - when: its title is 201 characters long
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message naming the title
spec/domains/opportunities.md:289: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is marked as open to remote work, the system shall require a description
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: of the remote arrangement; when it is not, the description may be left empty. In both cases
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: the description shall be at most 500 characters.
spec/domains/opportunities.md:293: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:294: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:296: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity marked remote-friendly with an empty remote description
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:300: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: The system shall require at least one skill on a Code With Us opportunity and at least one
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: mandatory skill on a Sprint With Us or Team With Us opportunity, shall limit each skill to
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: 100 characters, and shall silently discard duplicate skills.
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:53
spec/domains/opportunities.md:306: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:56
spec/domains/opportunities.md:307: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published with no skills listed
spec/domains/opportunities.md:309: expected a heading (### ID · vN · confidence · origin), got: - when: it is submitted
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message asking for at least one skill
spec/domains/opportunities.md:312: malformed heading: ### D-opportunities-23 (v1) [confidence: inferred]
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: The system shall cap a Code With Us reward at $70,000 and require it to be at least $1, and
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: shall cap a Sprint With Us total budget at $5,000,000 and require it to be at least $1.
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:28
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:320: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity with a reward of $70,001
spec/domains/opportunities.md:321: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:323: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us has no upper limit on its maximum budget — only a lower bound of $1
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got:   (`src/shared/lib/validation/opportunity/team-with-us.ts:176`). Whether the absent cap is
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got:   deliberate or an oversight cannot be settled from the code.
spec/domains/opportunities.md:327: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: assignment date, then start date, then completion date — with the proposal deadline no
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: earlier than today, and shall record every one of them at 4pm Pacific time on the chosen day.
spec/domains/opportunities.md:331: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:332: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:334: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:26
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: - when: its assignment date is set earlier than its proposal deadline
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:340: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: measure the new proposal deadline against the old deadline rather than against today, so
spec/domains/opportunities.md:343: expected a heading (### ID · vN · confidence · origin), got: that a closed opportunity can be re-dated without the deadline having to be in the future.
spec/domains/opportunities.md:344: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:346: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:543
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose deadline passed a month ago and which is no longer published
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it and sets a deadline three weeks ago
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is accepted
spec/domains/opportunities.md:352: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: The system shall require the four Sprint With Us scoring weights (team questions, code
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: challenge, team scenario, price) to total exactly 100 percent, and likewise the three Team
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: With Us weights (resource questions, challenge, price).
spec/domains/opportunities.md:356: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:357: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:615
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:436
spec/domains/opportunities.md:359: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity whose weights total 90 percent
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying the weights must total 100 percent
spec/domains/opportunities.md:364: malformed heading: ### D-opportunities-27 (v1) [confidence: inferred]
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: The system shall not accept a Sprint With Us opportunity that defines an inception phase
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: without also defining a prototype phase; the implementation phase is always required.
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:628
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:206
spec/domains/opportunities.md:370: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:371: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity with an inception phase and an implementation phase
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: - when: it is published without a prototype phase
spec/domains/opportunities.md:373: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying a prototype phase must follow an
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got:   inception phase
spec/domains/opportunities.md:376: malformed heading: ### D-opportunities-28 (v1) [confidence: inferred]
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us or Team With Us evaluation panel to have at least
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: two members, at most one chair, no member listed twice, and every member a public sector
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: employee.
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:382: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:429
spec/domains/opportunities.md:383: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:32
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:385: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity being published
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: - when: its evaluation panel names two chairs
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying only a single chair may be specified
spec/domains/opportunities.md:389: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: The system shall let a Team With Us opportunity request one or more resources, each drawn
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: from a fixed list of five service areas — full stack developer, data professional, agile
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: coach, devops specialist, service designer — with a target allocation between 1 and 100
spec/domains/opportunities.md:393: expected a heading (### ID · vN · confidence · origin), got: percent of full time.
spec/domains/opportunities.md:394: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:396: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: - when: a resource is added with a target allocation of 120 percent
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:402: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: The system shall allow at most 100 evaluation questions on a Sprint With Us or Team With Us
spec/domains/opportunities.md:404: expected a heading (### ID · vN · confidence · origin), got: opportunity, each with a word limit between 1 and 3,000 words, an available score of at
spec/domains/opportunities.md:405: expected a heading (### ID · vN · confidence · origin), got: least 1, and — where a minimum passing score is set — a minimum strictly below the available
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: score.
spec/domains/opportunities.md:407: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:14
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:78
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:100
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us question worth 5 points
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: - when: its minimum passing score is set to 5
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:418: expected a heading (### ID · vN · confidence · origin), got: ## Publishing, and the status lifecycle
spec/domains/opportunities.md:420: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:421: expected a heading (### ID · vN · confidence · origin), got: Every opportunity shall hold exactly one status at a time, drawn from its programme's set:
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: Code With Us — draft, under review, published, evaluation, processing, awarded, cancelled;
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: Sprint With Us — draft, under review, published, individual team-question evaluation,
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: team-question consensus, code challenge, team scenario, processing, awarded, cancelled; Team
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: With Us — draft, under review, published, individual resource-question evaluation,
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: resource-question consensus, challenge, processing, awarded, cancelled.
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:430: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:431: expected a heading (### ID · vN · confidence · origin), got: - cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:433: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in any program
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: - when: its status is read
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: - then: it is one of the values listed for that program
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: - note: each program also defines a "suspended" status marked deprecated in the code. No
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got:   transition reaches it and nothing sets it, so it exists only for records written by an
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got:   earlier version of the application. The Code With Us OpenAPI file
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got:   (`src/back-end/docs/opportunities/code-with-us.yaml:180`) documents the creatable statuses
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got:   as draft and published only, omitting under review, which the code has accepted since the
spec/domains/opportunities.md:441: expected a heading (### ID · vN · confidence · origin), got:   migration at `src/migrations/tasks/20231102143211_cwu-opp-under-review.ts`.
spec/domains/opportunities.md:443: malformed heading: ### D-opportunities-32 (v1) [confidence: inferred]
spec/domains/opportunities.md:444: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity; a public sector
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: employee shall instead submit it for review, moving it to the under-review status.
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:347
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity authored by a public sector employee
spec/domains/opportunities.md:451: expected a heading (### ID · vN · confidence · origin), got: - when: the author acts on it
spec/domains/opportunities.md:452: expected a heading (### ID · vN · confidence · origin), got: - then: the action offered is "submit for review", and the opportunity moves to under review
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got:   rather than published
spec/domains/opportunities.md:455: malformed heading: ### D-opportunities-33 (v1) [confidence: open]
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: When creating an opportunity, the system shall refuse a public sector employee who is not an
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: administrator the ability to create it directly in the published status.
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:463: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in public sector employee who is not an administrator
spec/domains/opportunities.md:464: expected a heading (### ID · vN · confidence · origin), got: - when: they create a Code With Us opportunity with the published status
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused
spec/domains/opportunities.md:466: expected a heading (### ID · vN · confidence · origin), got: - note: this is the Sprint With Us and Team With Us behaviour, where the create permission
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got:   takes the requested status and refuses `PUBLISHED` for a non-administrator. The Code With
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got:   Us create permission takes no status at all and permits any public sector employee, so a
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got:   Code With Us opportunity can be created directly as published by a user who would not be
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got:   allowed to publish that same opportunity a moment later. The user interface never offers
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got:   this, so it is reachable only by calling the interface directly. Marked `open` because the
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got:   three programs contradict each other and nothing in the code or documentation says which
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got:   is intended; the correction stated here assumes the two-of-three behaviour is the rule and
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got:   Code With Us is the omission, which needs a human ruling.
spec/domains/opportunities.md:476: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:477: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to submit for review or to publish an opportunity that is
spec/domains/opportunities.md:478: expected a heading (### ID · vN · confidence · origin), got: incomplete, and shall say that the opportunity must be completed and saved before it can be
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: published again.
spec/domains/opportunities.md:480: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:714
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:764
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with no description
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused with a message saying the opportunity is incomplete
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: - note: the completeness check applied when submitting for review is narrower than the one
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got:   applied when publishing — it checks title, teaser, remote flag, remote description,
spec/domains/opportunities.md:489: expected a heading (### ID · vN · confidence · origin), got:   location and description, while publishing additionally checks reward, skills, submission
spec/domains/opportunities.md:490: expected a heading (### ID · vN · confidence · origin), got:   information, acceptance criteria and evaluation criteria. A Code With Us opportunity can
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got:   therefore pass review submission and still be refused at publication.
spec/domains/opportunities.md:493: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: The system shall permit only these status moves: from draft to under review or published;
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: from under review to published; from published to cancelled or to the program's first
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: evaluation stage; through the program's evaluation stages in order, each also able to move
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: to cancelled; from the last evaluation stage to processing; and from processing to awarded
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: or cancelled.
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:500: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:501: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:503: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: - when: any actor attempts to move it back to published
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: - then: the move is refused
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: - note: the Team With Us transition table omits processing-to-awarded, which its Code With
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got:   Us and Sprint With Us counterparts both list. Awarding a Team With Us opportunity still
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got:   works, because awarding writes the awarded status directly rather than going through the
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got:   transition check (`src/back-end/lib/db/proposal/team-with-us.ts:1460`). The omission is
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got:   therefore latent rather than visible, but it means the two paths to the awarded status
spec/domains/opportunities.md:512: expected a heading (### ID · vN · confidence · origin), got:   disagree about whether it is legal.
spec/domains/opportunities.md:514: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:515: expected a heading (### ID · vN · confidence · origin), got: When an opportunity's proposal deadline passes, the system shall move it out of the published
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: status into the program's first evaluation stage, move every submitted proposal on it into
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: review, and notify the author that the opportunity is ready for evaluation.
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:523: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one submitted proposal and a deadline one minute ago
spec/domains/opportunities.md:524: expected a heading (### ID · vN · confidence · origin), got: - when: the deadline has passed
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is in evaluation, the proposal is under review, and the author has
spec/domains/opportunities.md:526: expected a heading (### ID · vN · confidence · origin), got:   been notified
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: - note: for Sprint With Us and Team With Us this transition also assigns each submitted
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got:   proposal an anonymous name of the form "Proponent 1", "Proponent 2" and so on. Code With
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got:   Us does not anonymise.
spec/domains/opportunities.md:531: malformed heading: ### D-opportunities-37 (v1) [confidence: inferred]
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: The deadline transition shall be driven by incoming traffic rather than by a clock: it runs
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: before handling a request, at most once per throttle window, so an opportunity whose
spec/domains/opportunities.md:534: expected a heading (### ID · vN · confidence · origin), got: deadline has passed stays published until the next request arrives.
spec/domains/opportunities.md:535: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/hooks/code-with-us.ts:17
spec/domains/opportunities.md:537: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:196
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:256
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity whose deadline has just passed and an idle application
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: - when: no request is made
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity remains published; it moves to evaluation on the first request that
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got:   arrives after the throttle window elapses
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: - note: the same check is attached to the status endpoint specifically so that a health
spec/domains/opportunities.md:545: expected a heading (### ID · vN · confidence · origin), got:   probe keeps it running when nothing else does. This is a property a rebuild has to decide
spec/domains/opportunities.md:546: expected a heading (### ID · vN · confidence · origin), got:   about deliberately — a scheduled job and a request hook are not observationally
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got:   equivalent when traffic is low.
spec/domains/opportunities.md:549: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: When every active proposal on an opportunity has been evaluated at the final evaluation
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: stage, the system shall move the opportunity to processing on its own and record the reason
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: in the history.
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:555: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:556: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity in evaluation with two proposals
spec/domains/opportunities.md:558: expected a heading (### ID · vN · confidence · origin), got: - when: the second proposal is scored
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity moves to processing and the history records that it was moved
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got:   automatically because all proposals were evaluated
spec/domains/opportunities.md:562: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: When a proposal is awarded, the system shall move its opportunity to the awarded status, mark
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: every other proposal that reached evaluation as not awarded, and show the successful
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: proponent on the opportunity.
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:567: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
spec/domains/opportunities.md:568: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:570: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in processing with three evaluated proposals
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: - when: one is awarded
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is awarded, the other two are marked not awarded, and the
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got:   opportunity shows the winning proponent's name
spec/domains/opportunities.md:575: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: The system shall show the successful proponent's contact email and the author of their
spec/domains/opportunities.md:577: expected a heading (### ID · vN · confidence · origin), got: proposal only to a viewer who is also permitted to see the winning score; every other viewer
spec/domains/opportunities.md:578: expected a heading (### ID · vN · confidence · origin), got: sees the proponent's name alone.
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:580: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:452
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor views it
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: - then: the successful proponent's name is shown but no email address
spec/domains/opportunities.md:586: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:587: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and only while it is
spec/domains/opportunities.md:588: expected a heading (### ID · vN · confidence · origin), got: published or in an evaluation or processing stage.
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:590: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: - when: its public sector employee author attempts to cancel it
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:597: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:598: expected a heading (### ID · vN · confidence · origin), got: The system shall keep a cancelled opportunity visible to the public rather than removing it.
spec/domains/opportunities.md:599: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:600: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:114
spec/domains/opportunities.md:601: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:602: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:603: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity
spec/domains/opportunities.md:604: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor requests it
spec/domains/opportunities.md:605: expected a heading (### ID · vN · confidence · origin), got: - then: it is shown, marked cancelled
spec/domains/opportunities.md:607: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:609: expected a heading (### ID · vN · confidence · origin), got: ## Editing, addenda and notes
spec/domains/opportunities.md:611: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:612: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited only while it is a draft, under
spec/domains/opportunities.md:613: expected a heading (### ID · vN · confidence · origin), got: review, or published, and shall refuse edits once it has entered evaluation.
spec/domains/opportunities.md:614: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:615: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:616: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:174
spec/domains/opportunities.md:617: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:618: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in evaluation
spec/domains/opportunities.md:619: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator submits an edit
spec/domains/opportunities.md:620: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is refused
spec/domains/opportunities.md:622: malformed heading: ### D-opportunities-44 (v1) [confidence: open]
spec/domains/opportunities.md:623: expected a heading (### ID · vN · confidence · origin), got: Once an opportunity is published, only an administrator shall be able to edit its details.
spec/domains/opportunities.md:624: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:625: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:626: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:627: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:628: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: conflicting
spec/domains/opportunities.md:629: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity authored by a public sector employee who is not an
spec/domains/opportunities.md:630: expected a heading (### ID · vN · confidence · origin), got:   administrator
spec/domains/opportunities.md:631: expected a heading (### ID · vN · confidence · origin), got: - when: that author edits it
spec/domains/opportunities.md:632: expected a heading (### ID · vN · confidence · origin), got: - then: the two layers disagree — the user interface withholds the edit, while the interface
spec/domains/opportunities.md:633: expected a heading (### ID · vN · confidence · origin), got:   behind it accepts an edit from the author
spec/domains/opportunities.md:634: expected a heading (### ID · vN · confidence · origin), got: - note: `canCWUOpportunityDetailsBeEdited` returns true for a published opportunity only
spec/domains/opportunities.md:635: expected a heading (### ID · vN · confidence · origin), got:   when the viewer is an administrator, and the form uses that to decide whether to send the
spec/domains/opportunities.md:636: expected a heading (### ID · vN · confidence · origin), got:   change at all; but the permission the request is actually checked against
spec/domains/opportunities.md:637: expected a heading (### ID · vN · confidence · origin), got:   (`editCWUOpportunity`) allows an administrator *or* the opportunity's public sector author
spec/domains/opportunities.md:638: expected a heading (### ID · vN · confidence · origin), got:   in every editable status. So the restriction is presentational only. Which of the two is
spec/domains/opportunities.md:639: expected a heading (### ID · vN · confidence · origin), got:   the intended rule cannot be recovered from the code; both are stated deliberately.
spec/domains/opportunities.md:641: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:642: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity is edited, the system shall notify everyone watching it, every
spec/domains/opportunities.md:643: expected a heading (### ID · vN · confidence · origin), got: vendor who has a proposal on it, and its author — unless the opportunity is a draft or has
spec/domains/opportunities.md:644: expected a heading (### ID · vN · confidence · origin), got: been cancelled, in which case no notification is sent.
spec/domains/opportunities.md:645: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:646: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:647: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:648: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:649: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:650: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it
spec/domains/opportunities.md:651: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher, the proposal's author and the opportunity's author are each notified
spec/domains/opportunities.md:653: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:654: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, add an addendum to any
spec/domains/opportunities.md:655: expected a heading (### ID · vN · confidence · origin), got: opportunity that is not a draft; the addendum shall be between 1 and 5,000 characters, shall
spec/domains/opportunities.md:656: expected a heading (### ID · vN · confidence · origin), got: be appended to the opportunity permanently, and shall notify watchers and proponents in the
spec/domains/opportunities.md:657: expected a heading (### ID · vN · confidence · origin), got: same way an edit does.
spec/domains/opportunities.md:658: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:659: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:660: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/addendum.ts:3
spec/domains/opportunities.md:661: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:982
spec/domains/opportunities.md:662: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:663: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:664: expected a heading (### ID · vN · confidence · origin), got: - when: its author adds an addendum
spec/domains/opportunities.md:665: expected a heading (### ID · vN · confidence · origin), got: - then: the addendum is shown on the opportunity and the watchers are notified
spec/domains/opportunities.md:667: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:668: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator or the opportunity's author attach a private note, with
spec/domains/opportunities.md:669: expected a heading (### ID · vN · confidence · origin), got: file attachments, to an opportunity's history, at most 1,000 characters, and shall send no
spec/domains/opportunities.md:670: expected a heading (### ID · vN · confidence · origin), got: notification when one is added.
spec/domains/opportunities.md:671: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:672: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:673: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:674: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:675: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:676: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:677: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator adds a note with an attachment
spec/domains/opportunities.md:678: expected a heading (### ID · vN · confidence · origin), got: - then: the note and its attachment appear in the history and no one is notified
spec/domains/opportunities.md:679: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us notes carry no attachments — its history record type has no attachment
spec/domains/opportunities.md:680: expected a heading (### ID · vN · confidence · origin), got:   field (`src/shared/lib/resources/opportunity/team-with-us.ts:46`), unlike the Code With Us
spec/domains/opportunities.md:681: expected a heading (### ID · vN · confidence · origin), got:   and Sprint With Us equivalents. Whether that is a deliberate difference or an unfinished
spec/domains/opportunities.md:682: expected a heading (### ID · vN · confidence · origin), got:   port cannot be determined from the code.
spec/domains/opportunities.md:684: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:685: expected a heading (### ID · vN · confidence · origin), got: The system shall record a note against every status change, of at most 1,000 characters, and
spec/domains/opportunities.md:686: expected a heading (### ID · vN · confidence · origin), got: shall show it in the opportunity's history alongside the status it accompanied.
spec/domains/opportunities.md:687: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:688: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:689: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:810
spec/domains/opportunities.md:690: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:691: expected a heading (### ID · vN · confidence · origin), got: - given: an administrator cancelling an opportunity
spec/domains/opportunities.md:692: expected a heading (### ID · vN · confidence · origin), got: - when: they supply a reason
spec/domains/opportunities.md:693: expected a heading (### ID · vN · confidence · origin), got: - then: the reason is stored with the cancellation and shown in the history
spec/domains/opportunities.md:695: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:697: expected a heading (### ID · vN · confidence · origin), got: ## Deleting
spec/domains/opportunities.md:699: malformed heading: ### D-opportunities-49 (v1) [confidence: inferred]
spec/domains/opportunities.md:700: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator permanently delete an opportunity only while it is a
spec/domains/opportunities.md:701: expected a heading (### ID · vN · confidence · origin), got: draft or under review, and shall let its public sector employee author delete it only while
spec/domains/opportunities.md:702: expected a heading (### ID · vN · confidence · origin), got: it is a draft.
spec/domains/opportunities.md:703: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:704: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:705: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:706: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:707: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:708: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:709: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:710: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:711: expected a heading (### ID · vN · confidence · origin), got: - note: the OpenAPI file describes deletion as restricted to drafts and says the request
spec/domains/opportunities.md:712: expected a heading (### ID · vN · confidence · origin), got:   "will fail if the Opportunity is not in Draft or has previously been published". The code
spec/domains/opportunities.md:713: expected a heading (### ID · vN · confidence · origin), got:   additionally permits an administrator to delete an under-review opportunity, and never
spec/domains/opportunities.md:714: expected a heading (### ID · vN · confidence · origin), got:   looks at whether the opportunity was previously published — only at its current status.
spec/domains/opportunities.md:716: malformed heading: ### D-opportunities-50 (v1) [confidence: inferred]
spec/domains/opportunities.md:717: expected a heading (### ID · vN · confidence · origin), got: For Team With Us, deletion shall be restricted the same way it is for the other two
spec/domains/opportunities.md:718: expected a heading (### ID · vN · confidence · origin), got: programs.
spec/domains/opportunities.md:719: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:720: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1139
spec/domains/opportunities.md:721: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:722: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:723: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:724: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:725: expected a heading (### ID · vN · confidence · origin), got: - then: the deletion succeeds, where the equivalent Code With Us or Sprint With Us deletion
spec/domains/opportunities.md:726: expected a heading (### ID · vN · confidence · origin), got:   would be refused
spec/domains/opportunities.md:727: expected a heading (### ID · vN · confidence · origin), got: - note: the recovered behaviour is stated in the "then" and differs from the criterion. The
spec/domains/opportunities.md:728: expected a heading (### ID · vN · confidence · origin), got:   Team With Us delete permission checks role and authorship but no status at all; the status
spec/domains/opportunities.md:729: expected a heading (### ID · vN · confidence · origin), got:   restriction to draft-or-under-review is applied one layer up, and applies equally to the
spec/domains/opportunities.md:730: expected a heading (### ID · vN · confidence · origin), got:   author and to administrators. So a Team With Us author can delete their own opportunity
spec/domains/opportunities.md:731: expected a heading (### ID · vN · confidence · origin), got:   after it has been submitted for review, which their Code With Us and Sprint With Us
spec/domains/opportunities.md:732: expected a heading (### ID · vN · confidence · origin), got:   counterparts cannot. There is no replacement criterion because whether the Team With Us
spec/domains/opportunities.md:733: expected a heading (### ID · vN · confidence · origin), got:   latitude was intentional is not recoverable from the code.
spec/domains/opportunities.md:735: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:737: expected a heading (### ID · vN · confidence · origin), got: ## Watching an opportunity
spec/domains/opportunities.md:739: malformed heading: ### D-opportunities-51 (v1) [confidence: inferred]
spec/domains/opportunities.md:740: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity and stop watching it, and shall
spec/domains/opportunities.md:741: expected a heading (### ID · vN · confidence · origin), got: show them whether they are currently watching it.
spec/domains/opportunities.md:742: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:743: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:36
spec/domains/opportunities.md:744: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:167
spec/domains/opportunities.md:745: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:746: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor viewing a published opportunity they do not watch
spec/domains/opportunities.md:747: expected a heading (### ID · vN · confidence · origin), got: - when: they choose to watch it
spec/domains/opportunities.md:748: expected a heading (### ID · vN · confidence · origin), got: - then: the control changes to show they are watching, and choosing it again stops the watch
spec/domains/opportunities.md:750: malformed heading: ### D-opportunities-52 (v1) [confidence: inferred]
spec/domains/opportunities.md:751: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to let a user watch an opportunity they authored.
spec/domains/opportunities.md:752: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:753: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:754: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:755: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee viewing their own published opportunity
spec/domains/opportunities.md:756: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to watch it
spec/domains/opportunities.md:757: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused with a message saying they cannot watch their own opportunity
spec/domains/opportunities.md:759: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:761: expected a heading (### ID · vN · confidence · origin), got: ## Notifications
spec/domains/opportunities.md:763: malformed heading: ### D-opportunities-53 (v1) [confidence: inferred]
spec/domains/opportunities.md:764: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall notify every administrator and
spec/domains/opportunities.md:765: expected a heading (### ID · vN · confidence · origin), got: the opportunity's author.
spec/domains/opportunities.md:766: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:767: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:768: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:769: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity
spec/domains/opportunities.md:770: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:771: expected a heading (### ID · vN · confidence · origin), got: - then: every administrator receives a notification, and so does the author
spec/domains/opportunities.md:773: malformed heading: ### D-opportunities-54 (v1) [confidence: inferred]
spec/domains/opportunities.md:774: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall notify every user who has opted in to
spec/domains/opportunities.md:775: expected a heading (### ID · vN · confidence · origin), got: opportunity notifications, and separately confirm the publication to the opportunity's author.
spec/domains/opportunities.md:776: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:777: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:778: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:779: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who has opted in to notifications
spec/domains/opportunities.md:780: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator publishes an opportunity
spec/domains/opportunities.md:781: expected a heading (### ID · vN · confidence · origin), got: - then: that vendor is notified of the new opportunity and the author is told the
spec/domains/opportunities.md:782: expected a heading (### ID · vN · confidence · origin), got:   publication succeeded
spec/domains/opportunities.md:784: malformed heading: ### D-opportunities-55 (v1) [confidence: inferred]
spec/domains/opportunities.md:785: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is cancelled, the system shall notify everyone watching it and every
spec/domains/opportunities.md:786: expected a heading (### ID · vN · confidence · origin), got: vendor with a proposal on it, and separately tell the author that the cancellation was
spec/domains/opportunities.md:787: expected a heading (### ID · vN · confidence · origin), got: carried out.
spec/domains/opportunities.md:788: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:789: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:790: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:791: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:792: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator cancels it
spec/domains/opportunities.md:793: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher and the proposal's author are notified of the cancellation, and the
spec/domains/opportunities.md:794: expected a heading (### ID · vN · confidence · origin), got:   opportunity's author is told it was cancelled
spec/domains/opportunities.md:796: malformed heading: ### D-opportunities-56 (v1) [confidence: inferred]
spec/domains/opportunities.md:797: expected a heading (### ID · vN · confidence · origin), got: The system shall address a recipient only once per notification even when they both watch an
spec/domains/opportunities.md:798: expected a heading (### ID · vN · confidence · origin), got: opportunity and hold a proposal on it.
spec/domains/opportunities.md:799: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:800: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:190
spec/domains/opportunities.md:801: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:802: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who both watches an opportunity and has submitted a proposal to it
spec/domains/opportunities.md:803: expected a heading (### ID · vN · confidence · origin), got: - when: the opportunity is edited
spec/domains/opportunities.md:804: expected a heading (### ID · vN · confidence · origin), got: - then: they receive one notification, not two
spec/domains/opportunities.md:27: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: The system shall publish procurement opportunities under exactly three programs — Code With
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: Us, Sprint With Us and Team With Us — each with its own creation form, its own detail page
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: and its own set of statuses.
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:77
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:105
spec/domains/opportunities.md:34: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:160
spec/domains/opportunities.md:35: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: aligned
spec/domains/opportunities.md:37: expected a heading (### ID · vN · confidence · origin), got: - given: a visitor on the "create an opportunity" page
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: - when: the page is displayed
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: - then: three programs are offered, each with a guide link and a "get started" link to its
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got:   own creation form
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: - note: the shipped prose disagrees with the shipped code. `README.md:5` describes the
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got:   service as administering "Code With Us and Sprint With Us"; `docs/database-schema.md`
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got:   documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got:   for the Code With Us and Sprint With Us opportunity endpoints but none for Team With Us,
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got:   although the Team With Us resource is registered in the router. Three programs is what the
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got:   code does; the documentation is stale on all three counts.
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-2 (v1) [confidence: inferred]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall record an opportunity as a chain of immutable versions with a separate
spec/domains/opportunities.md:50: expected a heading (### ID · vN · confidence · origin), got: chain of status and event records, so that every change to a published opportunity leaves a
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: history entry rather than overwriting the previous content.
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: - cites: docs/database-schema.md:156
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity that has been edited twice
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens its history
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: - then: the history shows one entry per edit, in addition to the entries for each status
spec/domains/opportunities.md:59: expected a heading (### ID · vN · confidence · origin), got:   change, and the opportunity displays the most recent version's content
spec/domains/opportunities.md:61: malformed heading: ### D-opportunities-3 (v1) [confidence: inferred]
spec/domains/opportunities.md:62: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has never been given a title as "Untitled" in
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: listings and headings.
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:150
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with an empty title
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: - when: its author opens the opportunity listing
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity appears with the title "Untitled"
spec/domains/opportunities.md:72: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:74: expected a heading (### ID · vN · confidence · origin), got: ## Who may see what
spec/domains/opportunities.md:76: malformed heading: ### D-opportunities-4 (v1) [confidence: confirmed]
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public status,
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: both in the listing and when a single opportunity is requested by its identifier.
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:84: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity and a published opportunity
spec/domains/opportunities.md:85: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor opens the opportunity listing, and then requests the draft
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got:   opportunity's address directly
spec/domains/opportunities.md:87: expected a heading (### ID · vN · confidence · origin), got: - then: the listing shows only the published opportunity, and the direct request is answered
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got:   as not found
spec/domains/opportunities.md:90: malformed heading: ### D-opportunities-5 (v1) [confidence: confirmed]
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every opportunity in a public status plus the
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: unpublished opportunities they authored, and no other unpublished opportunity.
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:98: expected a heading (### ID · vN · confidence · origin), got: - given: two public sector employees, each with one draft opportunity
spec/domains/opportunities.md:99: expected a heading (### ID · vN · confidence · origin), got: - when: the first opens the opportunity listing
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: - then: their own draft is listed and the other employee's draft is not
spec/domains/opportunities.md:102: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: The system shall show an administrator every opportunity regardless of status.
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:406
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:626
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: - given: draft opportunities authored by several different public sector employees
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens the opportunity listing
spec/domains/opportunities.md:110: expected a heading (### ID · vN · confidence · origin), got: - then: all of them are listed
spec/domains/opportunities.md:112: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:113: expected a heading (### ID · vN · confidence · origin), got: For Sprint With Us and Team With Us, the system shall additionally let a member of an
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: opportunity's evaluation panel open that opportunity while it is still unpublished, even
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: when they did not author it.
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: - given: a draft Sprint With Us opportunity whose evaluation panel includes a public sector
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got:   employee who is not its author
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: - when: that panel member requests the opportunity
spec/domains/opportunities.md:122: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is shown to them
spec/domains/opportunities.md:123: expected a heading (### ID · vN · confidence · origin), got: - note: Code With Us has no evaluation panel and so no equivalent rule.
spec/domains/opportunities.md:125: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: The system shall offer a way to list only the opportunities on whose evaluation panel the
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: requesting public sector employee sits, and when that view is requested it shall exclude
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: every other opportunity, including public ones.
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: - given: a panel member who also authored an unrelated published opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: - when: they request the panel-member view of the listing
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: - then: only the opportunities they sit on a panel for are returned
spec/domains/opportunities.md:137: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:138: expected a heading (### ID · vN · confidence · origin), got: The system shall withhold the identity of an opportunity's author and last editor from every
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: viewer except an administrator, the author, and the last editor.
spec/domains/opportunities.md:140: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor views it
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: - then: no author or editor name is shown
spec/domains/opportunities.md:147: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:148: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's change history only to an administrator or the
spec/domains/opportunities.md:149: expected a heading (### ID · vN · confidence · origin), got: opportunity's author.
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:151: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:478
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with several status changes
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor and then the author view it
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: - then: the vendor sees no history and the author sees the full list of status changes and
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got:   events
spec/domains/opportunities.md:158: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's reporting figures — number of views, number of
spec/domains/opportunities.md:160: expected a heading (### ID · vN · confidence · origin), got: watchers, number of submitted proposals — only to an administrator or the author, and only
spec/domains/opportunities.md:161: expected a heading (### ID · vN · confidence · origin), got: once the opportunity has reached a public status.
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:163: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with two submitted proposals
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: - when: the author views it
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: - then: the view count, watcher count and proposal count are shown; a vendor viewing the
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got:   same opportunity sees none of them
spec/domains/opportunities.md:170: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: The system shall count one additional view of an opportunity each time its detail page is
spec/domains/opportunities.md:172: expected a heading (### ID · vN · confidence · origin), got: opened.
spec/domains/opportunities.md:173: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:175: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/counter.ts
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose reported view count is a known number
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: - when: any visitor opens its detail page
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: - then: the view count reported to the author increases by one
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: ## Listing, sorting and filtering
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity listing into three sections — unpublished, open and
spec/domains/opportunities.md:187: expected a heading (### ID · vN · confidence · origin), got: closed — where open means published with a proposal deadline still in the future, closed
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: means published-or-later with the deadline passed or the opportunity no longer accepting
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: proposals, and unpublished means draft or under review.
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: - given: one draft, one published opportunity with a future deadline, and one awarded
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got:   opportunity
spec/domains/opportunities.md:196: expected a heading (### ID · vN · confidence · origin), got: - when: the author opens the listing
spec/domains/opportunities.md:197: expected a heading (### ID · vN · confidence · origin), got: - then: each appears in the unpublished, open and closed section respectively
spec/domains/opportunities.md:199: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: The system shall order open opportunities by soonest proposal deadline first, closed
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: opportunities by most recently passed deadline first, and unpublished opportunities by most
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: recently changed first.
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:194
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: - given: three open opportunities with deadlines a week apart
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor opens the listing
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: - then: they appear in ascending order of deadline
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall let a visitor narrow the opportunity listing by program, by status, to
spec/domains/opportunities.md:212: expected a heading (### ID · vN · confidence · origin), got: remote-friendly opportunities only, and by a text search matched against title and location.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: - given: opportunities across all three programs, some remote-friendly
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects the Code With Us program and ticks the remote-only option
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: - then: only remote-friendly Code With Us opportunities remain listed
spec/domains/opportunities.md:221: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: The status filter on the opportunity listing shall offer a choice for every status an
spec/domains/opportunities.md:223: expected a heading (### ID · vN · confidence · origin), got: opportunity can hold.
spec/domains/opportunities.md:224: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:60
spec/domains/opportunities.md:226: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:346
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity and an opportunity in the processing status
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects any value in the status filter
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: - then: neither opportunity can be brought back into view by any filter choice, because the
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got:   filter offers only draft, under review, published, evaluation and awarded
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: - note: this is written as the intended behaviour, not as the recovered behaviour. The
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got:   recovered behaviour is that cancelled and processing opportunities are silently excluded
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got:   whenever a status filter is applied. There is no replacement criterion because whether the
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got:   fix is to add the two missing choices or to change what the existing choices match is a
spec/domains/opportunities.md:236: expected a heading (### ID · vN · confidence · origin), got:   product decision, not something the code settles.
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: ## Creating an opportunity
spec/domains/opportunities.md:242: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator or a public sector employee to create an
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: opportunity, and shall refuse the attempt for a vendor or an anonymous visitor.
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:247: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:75
spec/domains/opportunities.md:248: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor
spec/domains/opportunities.md:250: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to create an opportunity
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused and no opportunity is created
spec/domains/opportunities.md:253: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is saved as a draft, the system shall accept it without checking any
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: field other than its attachments, and shall stand in a date fourteen days from now wherever
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: a required date is missing or invalid.
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:258: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:259: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee filling in the creation form
spec/domains/opportunities.md:261: expected a heading (### ID · vN · confidence · origin), got: - when: they save a draft with no title, no description and no dates
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: - then: the draft is created, and its proposal, assignment and start dates are set two weeks
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got:   from today
spec/domains/opportunities.md:265: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review or published rather than saved as a draft, the
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: system shall reject it unless every required field is valid, and shall say which fields are
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: at fault.
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:276
spec/domains/opportunities.md:271: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:272: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity form with an empty description
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: - when: the author submits it for review
spec/domains/opportunities.md:274: expected a heading (### ID · vN · confidence · origin), got: - then: the submission is rejected and the description field is reported as invalid
spec/domains/opportunities.md:276: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity whose title is empty or longer than 200 characters,
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: whose teaser is longer than 500 characters, whose description is empty or longer than 10,000
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: characters, or whose location is empty.
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:89
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:137
spec/domains/opportunities.md:283: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:147
spec/domains/opportunities.md:284: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:286: expected a heading (### ID · vN · confidence · origin), got: - when: its title is 201 characters long
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message naming the title
spec/domains/opportunities.md:289: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is marked as open to remote work, the system shall require a description
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: of the remote arrangement; when it is not, the description may be left empty. In both cases
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: the description shall be at most 500 characters.
spec/domains/opportunities.md:293: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:294: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:296: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity marked remote-friendly with an empty remote description
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:300: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: The system shall require at least one skill on a Code With Us opportunity and at least one
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: mandatory skill on a Sprint With Us or Team With Us opportunity, shall limit each skill to
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: 100 characters, and shall silently discard duplicate skills.
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:53
spec/domains/opportunities.md:306: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:56
spec/domains/opportunities.md:307: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published with no skills listed
spec/domains/opportunities.md:309: expected a heading (### ID · vN · confidence · origin), got: - when: it is submitted
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message asking for at least one skill
spec/domains/opportunities.md:312: malformed heading: ### D-opportunities-23 (v1) [confidence: inferred]
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: The system shall cap a Code With Us reward at $70,000 and require it to be at least $1, and
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: shall cap a Sprint With Us total budget at $5,000,000 and require it to be at least $1.
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:28
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:320: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity with a reward of $70,001
spec/domains/opportunities.md:321: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:323: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us has no upper limit on its maximum budget — only a lower bound of $1
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got:   (`src/shared/lib/validation/opportunity/team-with-us.ts:176`). Whether the absent cap is
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got:   deliberate or an oversight cannot be settled from the code.
spec/domains/opportunities.md:327: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: assignment date, then start date, then completion date — with the proposal deadline no
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: earlier than today, and shall record every one of them at 4pm Pacific time on the chosen day.
spec/domains/opportunities.md:331: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:332: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:334: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:26
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: - when: its assignment date is set earlier than its proposal deadline
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:340: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: measure the new proposal deadline against the old deadline rather than against today, so
spec/domains/opportunities.md:343: expected a heading (### ID · vN · confidence · origin), got: that a closed opportunity can be re-dated without the deadline having to be in the future.
spec/domains/opportunities.md:344: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:346: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:543
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose deadline passed a month ago and which is no longer published
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it and sets a deadline three weeks ago
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is accepted
spec/domains/opportunities.md:352: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: The system shall require the four Sprint With Us scoring weights (team questions, code
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: challenge, team scenario, price) to total exactly 100 percent, and likewise the three Team
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: With Us weights (resource questions, challenge, price).
spec/domains/opportunities.md:356: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:357: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:615
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:436
spec/domains/opportunities.md:359: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity whose weights total 90 percent
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying the weights must total 100 percent
spec/domains/opportunities.md:364: malformed heading: ### D-opportunities-27 (v1) [confidence: inferred]
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: The system shall not accept a Sprint With Us opportunity that defines an inception phase
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: without also defining a prototype phase; the implementation phase is always required.
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:628
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:206
spec/domains/opportunities.md:370: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:371: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity with an inception phase and an implementation phase
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: - when: it is published without a prototype phase
spec/domains/opportunities.md:373: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying a prototype phase must follow an
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got:   inception phase
spec/domains/opportunities.md:376: malformed heading: ### D-opportunities-28 (v1) [confidence: inferred]
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us or Team With Us evaluation panel to have at least
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: two members, at most one chair, no member listed twice, and every member a public sector
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: employee.
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:382: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:429
spec/domains/opportunities.md:383: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:32
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:385: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity being published
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: - when: its evaluation panel names two chairs
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying only a single chair may be specified
spec/domains/opportunities.md:389: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: The system shall let a Team With Us opportunity request one or more resources, each drawn
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: from a fixed list of five service areas — full stack developer, data professional, agile
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: coach, devops specialist, service designer — with a target allocation between 1 and 100
spec/domains/opportunities.md:393: expected a heading (### ID · vN · confidence · origin), got: percent of full time.
spec/domains/opportunities.md:394: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:396: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: - when: a resource is added with a target allocation of 120 percent
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:402: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: The system shall allow at most 100 evaluation questions on a Sprint With Us or Team With Us
spec/domains/opportunities.md:404: expected a heading (### ID · vN · confidence · origin), got: opportunity, each with a word limit between 1 and 3,000 words, an available score of at
spec/domains/opportunities.md:405: expected a heading (### ID · vN · confidence · origin), got: least 1, and — where a minimum passing score is set — a minimum strictly below the available
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: score.
spec/domains/opportunities.md:407: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:14
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:78
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:100
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us question worth 5 points
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: - when: its minimum passing score is set to 5
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:418: expected a heading (### ID · vN · confidence · origin), got: ## Publishing, and the status lifecycle
spec/domains/opportunities.md:420: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:421: expected a heading (### ID · vN · confidence · origin), got: Every opportunity shall hold exactly one status at a time, drawn from its programme's set:
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: Code With Us — draft, under review, published, evaluation, processing, awarded, cancelled;
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: Sprint With Us — draft, under review, published, individual team-question evaluation,
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: team-question consensus, code challenge, team scenario, processing, awarded, cancelled; Team
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: With Us — draft, under review, published, individual resource-question evaluation,
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: resource-question consensus, challenge, processing, awarded, cancelled.
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:430: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:431: expected a heading (### ID · vN · confidence · origin), got: - cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:433: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in any program
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: - when: its status is read
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: - then: it is one of the values listed for that program
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: - note: each program also defines a "suspended" status marked deprecated in the code. No
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got:   transition reaches it and nothing sets it, so it exists only for records written by an
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got:   earlier version of the application. The Code With Us OpenAPI file
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got:   (`src/back-end/docs/opportunities/code-with-us.yaml:180`) documents the creatable statuses
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got:   as draft and published only, omitting under review, which the code has accepted since the
spec/domains/opportunities.md:441: expected a heading (### ID · vN · confidence · origin), got:   migration at `src/migrations/tasks/20231102143211_cwu-opp-under-review.ts`.
spec/domains/opportunities.md:443: malformed heading: ### D-opportunities-32 (v1) [confidence: inferred]
spec/domains/opportunities.md:444: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity; a public sector
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: employee shall instead submit it for review, moving it to the under-review status.
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:347
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity authored by a public sector employee
spec/domains/opportunities.md:451: expected a heading (### ID · vN · confidence · origin), got: - when: the author acts on it
spec/domains/opportunities.md:452: expected a heading (### ID · vN · confidence · origin), got: - then: the action offered is "submit for review", and the opportunity moves to under review
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got:   rather than published
spec/domains/opportunities.md:455: malformed heading: ### D-opportunities-33 (v1) [confidence: open]
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: When creating an opportunity, the system shall refuse a public sector employee who is not an
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: administrator the ability to create it directly in the published status.
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:463: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in public sector employee who is not an administrator
spec/domains/opportunities.md:464: expected a heading (### ID · vN · confidence · origin), got: - when: they create a Code With Us opportunity with the published status
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused
spec/domains/opportunities.md:466: expected a heading (### ID · vN · confidence · origin), got: - note: this is the Sprint With Us and Team With Us behaviour, where the create permission
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got:   takes the requested status and refuses `PUBLISHED` for a non-administrator. The Code With
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got:   Us create permission takes no status at all and permits any public sector employee, so a
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got:   Code With Us opportunity can be created directly as published by a user who would not be
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got:   allowed to publish that same opportunity a moment later. The user interface never offers
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got:   this, so it is reachable only by calling the interface directly. Marked `open` because the
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got:   three programs contradict each other and nothing in the code or documentation says which
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got:   is intended; the correction stated here assumes the two-of-three behaviour is the rule and
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got:   Code With Us is the omission, which needs a human ruling.
spec/domains/opportunities.md:476: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:477: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to submit for review or to publish an opportunity that is
spec/domains/opportunities.md:478: expected a heading (### ID · vN · confidence · origin), got: incomplete, and shall say that the opportunity must be completed and saved before it can be
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: published again.
spec/domains/opportunities.md:480: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:714
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:764
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with no description
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused with a message saying the opportunity is incomplete
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: - note: the completeness check applied when submitting for review is narrower than the one
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got:   applied when publishing — it checks title, teaser, remote flag, remote description,
spec/domains/opportunities.md:489: expected a heading (### ID · vN · confidence · origin), got:   location and description, while publishing additionally checks reward, skills, submission
spec/domains/opportunities.md:490: expected a heading (### ID · vN · confidence · origin), got:   information, acceptance criteria and evaluation criteria. A Code With Us opportunity can
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got:   therefore pass review submission and still be refused at publication.
spec/domains/opportunities.md:493: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: The system shall permit only these status moves: from draft to under review or published;
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: from under review to published; from published to cancelled or to the program's first
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: evaluation stage; through the program's evaluation stages in order, each also able to move
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: to cancelled; from the last evaluation stage to processing; and from processing to awarded
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: or cancelled.
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:500: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:501: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:503: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: - when: any actor attempts to move it back to published
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: - then: the move is refused
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: - note: the Team With Us transition table omits processing-to-awarded, which its Code With
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got:   Us and Sprint With Us counterparts both list. Awarding a Team With Us opportunity still
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got:   works, because awarding writes the awarded status directly rather than going through the
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got:   transition check (`src/back-end/lib/db/proposal/team-with-us.ts:1460`). The omission is
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got:   therefore latent rather than visible, but it means the two paths to the awarded status
spec/domains/opportunities.md:512: expected a heading (### ID · vN · confidence · origin), got:   disagree about whether it is legal.
spec/domains/opportunities.md:514: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:515: expected a heading (### ID · vN · confidence · origin), got: When an opportunity's proposal deadline passes, the system shall move it out of the published
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: status into the program's first evaluation stage, move every submitted proposal on it into
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: review, and notify the author that the opportunity is ready for evaluation.
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:523: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one submitted proposal and a deadline one minute ago
spec/domains/opportunities.md:524: expected a heading (### ID · vN · confidence · origin), got: - when: the deadline has passed
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is in evaluation, the proposal is under review, and the author has
spec/domains/opportunities.md:526: expected a heading (### ID · vN · confidence · origin), got:   been notified
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: - note: for Sprint With Us and Team With Us this transition also assigns each submitted
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got:   proposal an anonymous name of the form "Proponent 1", "Proponent 2" and so on. Code With
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got:   Us does not anonymise.
spec/domains/opportunities.md:531: malformed heading: ### D-opportunities-37 (v1) [confidence: inferred]
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: The deadline transition shall be driven by incoming traffic rather than by a clock: it runs
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: before handling a request, at most once per throttle window, so an opportunity whose
spec/domains/opportunities.md:534: expected a heading (### ID · vN · confidence · origin), got: deadline has passed stays published until the next request arrives.
spec/domains/opportunities.md:535: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/hooks/code-with-us.ts:17
spec/domains/opportunities.md:537: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:196
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:256
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity whose deadline has just passed and an idle application
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: - when: no request is made
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity remains published; it moves to evaluation on the first request that
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got:   arrives after the throttle window elapses
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: - note: the same check is attached to the status endpoint specifically so that a health
spec/domains/opportunities.md:545: expected a heading (### ID · vN · confidence · origin), got:   probe keeps it running when nothing else does. This is a property a rebuild has to decide
spec/domains/opportunities.md:546: expected a heading (### ID · vN · confidence · origin), got:   about deliberately — a scheduled job and a request hook are not observationally
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got:   equivalent when traffic is low.
spec/domains/opportunities.md:549: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: When every active proposal on an opportunity has been evaluated at the final evaluation
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: stage, the system shall move the opportunity to processing on its own and record the reason
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: in the history.
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:555: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:556: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity in evaluation with two proposals
spec/domains/opportunities.md:558: expected a heading (### ID · vN · confidence · origin), got: - when: the second proposal is scored
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity moves to processing and the history records that it was moved
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got:   automatically because all proposals were evaluated
spec/domains/opportunities.md:562: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: When a proposal is awarded, the system shall move its opportunity to the awarded status, mark
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: every other proposal that reached evaluation as not awarded, and show the successful
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: proponent on the opportunity.
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:567: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
spec/domains/opportunities.md:568: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:570: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in processing with three evaluated proposals
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: - when: one is awarded
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is awarded, the other two are marked not awarded, and the
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got:   opportunity shows the winning proponent's name
spec/domains/opportunities.md:575: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: The system shall show the successful proponent's contact email and the author of their
spec/domains/opportunities.md:577: expected a heading (### ID · vN · confidence · origin), got: proposal only to a viewer who is also permitted to see the winning score; every other viewer
spec/domains/opportunities.md:578: expected a heading (### ID · vN · confidence · origin), got: sees the proponent's name alone.
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:580: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:452
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor views it
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: - then: the successful proponent's name is shown but no email address
spec/domains/opportunities.md:586: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:587: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and only while it is
spec/domains/opportunities.md:588: expected a heading (### ID · vN · confidence · origin), got: published or in an evaluation or processing stage.
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:590: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: - when: its public sector employee author attempts to cancel it
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:597: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:598: expected a heading (### ID · vN · confidence · origin), got: The system shall keep a cancelled opportunity visible to the public rather than removing it.
spec/domains/opportunities.md:599: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:600: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:114
spec/domains/opportunities.md:601: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:602: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:603: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity
spec/domains/opportunities.md:604: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor requests it
spec/domains/opportunities.md:605: expected a heading (### ID · vN · confidence · origin), got: - then: it is shown, marked cancelled
spec/domains/opportunities.md:607: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:609: expected a heading (### ID · vN · confidence · origin), got: ## Editing, addenda and notes
spec/domains/opportunities.md:611: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:612: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited only while it is a draft, under
spec/domains/opportunities.md:613: expected a heading (### ID · vN · confidence · origin), got: review, or published, and shall refuse edits once it has entered evaluation.
spec/domains/opportunities.md:614: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:615: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:616: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:174
spec/domains/opportunities.md:617: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:618: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in evaluation
spec/domains/opportunities.md:619: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator submits an edit
spec/domains/opportunities.md:620: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is refused
spec/domains/opportunities.md:622: malformed heading: ### D-opportunities-44 (v1) [confidence: open]
spec/domains/opportunities.md:623: expected a heading (### ID · vN · confidence · origin), got: Once an opportunity is published, only an administrator shall be able to edit its details.
spec/domains/opportunities.md:624: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:625: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:626: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:627: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:628: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: conflicting
spec/domains/opportunities.md:629: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity authored by a public sector employee who is not an
spec/domains/opportunities.md:630: expected a heading (### ID · vN · confidence · origin), got:   administrator
spec/domains/opportunities.md:631: expected a heading (### ID · vN · confidence · origin), got: - when: that author edits it
spec/domains/opportunities.md:632: expected a heading (### ID · vN · confidence · origin), got: - then: the two layers disagree — the user interface withholds the edit, while the interface
spec/domains/opportunities.md:633: expected a heading (### ID · vN · confidence · origin), got:   behind it accepts an edit from the author
spec/domains/opportunities.md:634: expected a heading (### ID · vN · confidence · origin), got: - note: `canCWUOpportunityDetailsBeEdited` returns true for a published opportunity only
spec/domains/opportunities.md:635: expected a heading (### ID · vN · confidence · origin), got:   when the viewer is an administrator, and the form uses that to decide whether to send the
spec/domains/opportunities.md:636: expected a heading (### ID · vN · confidence · origin), got:   change at all; but the permission the request is actually checked against
spec/domains/opportunities.md:637: expected a heading (### ID · vN · confidence · origin), got:   (`editCWUOpportunity`) allows an administrator *or* the opportunity's public sector author
spec/domains/opportunities.md:638: expected a heading (### ID · vN · confidence · origin), got:   in every editable status. So the restriction is presentational only. Which of the two is
spec/domains/opportunities.md:639: expected a heading (### ID · vN · confidence · origin), got:   the intended rule cannot be recovered from the code; both are stated deliberately.
spec/domains/opportunities.md:641: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:642: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity is edited, the system shall notify everyone watching it, every
spec/domains/opportunities.md:643: expected a heading (### ID · vN · confidence · origin), got: vendor who has a proposal on it, and its author — unless the opportunity is a draft or has
spec/domains/opportunities.md:644: expected a heading (### ID · vN · confidence · origin), got: been cancelled, in which case no notification is sent.
spec/domains/opportunities.md:645: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:646: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:647: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:648: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:649: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:650: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it
spec/domains/opportunities.md:651: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher, the proposal's author and the opportunity's author are each notified
spec/domains/opportunities.md:653: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:654: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, add an addendum to any
spec/domains/opportunities.md:655: expected a heading (### ID · vN · confidence · origin), got: opportunity that is not a draft; the addendum shall be between 1 and 5,000 characters, shall
spec/domains/opportunities.md:656: expected a heading (### ID · vN · confidence · origin), got: be appended to the opportunity permanently, and shall notify watchers and proponents in the
spec/domains/opportunities.md:657: expected a heading (### ID · vN · confidence · origin), got: same way an edit does.
spec/domains/opportunities.md:658: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:659: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:660: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/addendum.ts:3
spec/domains/opportunities.md:661: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:982
spec/domains/opportunities.md:662: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:663: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:664: expected a heading (### ID · vN · confidence · origin), got: - when: its author adds an addendum
spec/domains/opportunities.md:665: expected a heading (### ID · vN · confidence · origin), got: - then: the addendum is shown on the opportunity and the watchers are notified
spec/domains/opportunities.md:667: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:668: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator or the opportunity's author attach a private note, with
spec/domains/opportunities.md:669: expected a heading (### ID · vN · confidence · origin), got: file attachments, to an opportunity's history, at most 1,000 characters, and shall send no
spec/domains/opportunities.md:670: expected a heading (### ID · vN · confidence · origin), got: notification when one is added.
spec/domains/opportunities.md:671: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:672: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:673: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:674: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:675: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:676: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:677: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator adds a note with an attachment
spec/domains/opportunities.md:678: expected a heading (### ID · vN · confidence · origin), got: - then: the note and its attachment appear in the history and no one is notified
spec/domains/opportunities.md:679: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us notes carry no attachments — its history record type has no attachment
spec/domains/opportunities.md:680: expected a heading (### ID · vN · confidence · origin), got:   field (`src/shared/lib/resources/opportunity/team-with-us.ts:46`), unlike the Code With Us
spec/domains/opportunities.md:681: expected a heading (### ID · vN · confidence · origin), got:   and Sprint With Us equivalents. Whether that is a deliberate difference or an unfinished
spec/domains/opportunities.md:682: expected a heading (### ID · vN · confidence · origin), got:   port cannot be determined from the code.
spec/domains/opportunities.md:684: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:685: expected a heading (### ID · vN · confidence · origin), got: The system shall record a note against every status change, of at most 1,000 characters, and
spec/domains/opportunities.md:686: expected a heading (### ID · vN · confidence · origin), got: shall show it in the opportunity's history alongside the status it accompanied.
spec/domains/opportunities.md:687: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:688: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:689: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:810
spec/domains/opportunities.md:690: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:691: expected a heading (### ID · vN · confidence · origin), got: - given: an administrator cancelling an opportunity
spec/domains/opportunities.md:692: expected a heading (### ID · vN · confidence · origin), got: - when: they supply a reason
spec/domains/opportunities.md:693: expected a heading (### ID · vN · confidence · origin), got: - then: the reason is stored with the cancellation and shown in the history
spec/domains/opportunities.md:695: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:697: expected a heading (### ID · vN · confidence · origin), got: ## Deleting
spec/domains/opportunities.md:699: malformed heading: ### D-opportunities-49 (v1) [confidence: inferred]
spec/domains/opportunities.md:700: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator permanently delete an opportunity only while it is a
spec/domains/opportunities.md:701: expected a heading (### ID · vN · confidence · origin), got: draft or under review, and shall let its public sector employee author delete it only while
spec/domains/opportunities.md:702: expected a heading (### ID · vN · confidence · origin), got: it is a draft.
spec/domains/opportunities.md:703: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:704: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:705: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:706: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:707: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:708: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:709: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:710: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:711: expected a heading (### ID · vN · confidence · origin), got: - note: the OpenAPI file describes deletion as restricted to drafts and says the request
spec/domains/opportunities.md:712: expected a heading (### ID · vN · confidence · origin), got:   "will fail if the Opportunity is not in Draft or has previously been published". The code
spec/domains/opportunities.md:713: expected a heading (### ID · vN · confidence · origin), got:   additionally permits an administrator to delete an under-review opportunity, and never
spec/domains/opportunities.md:714: expected a heading (### ID · vN · confidence · origin), got:   looks at whether the opportunity was previously published — only at its current status.
spec/domains/opportunities.md:716: malformed heading: ### D-opportunities-50 (v1) [confidence: inferred]
spec/domains/opportunities.md:717: expected a heading (### ID · vN · confidence · origin), got: For Team With Us, deletion shall be restricted the same way it is for the other two
spec/domains/opportunities.md:718: expected a heading (### ID · vN · confidence · origin), got: programs.
spec/domains/opportunities.md:719: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:720: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1139
spec/domains/opportunities.md:721: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:722: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:723: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:724: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:725: expected a heading (### ID · vN · confidence · origin), got: - then: the deletion succeeds, where the equivalent Code With Us or Sprint With Us deletion
spec/domains/opportunities.md:726: expected a heading (### ID · vN · confidence · origin), got:   would be refused
spec/domains/opportunities.md:727: expected a heading (### ID · vN · confidence · origin), got: - note: the recovered behaviour is stated in the "then" and differs from the criterion. The
spec/domains/opportunities.md:728: expected a heading (### ID · vN · confidence · origin), got:   Team With Us delete permission checks role and authorship but no status at all; the status
spec/domains/opportunities.md:729: expected a heading (### ID · vN · confidence · origin), got:   restriction to draft-or-under-review is applied one layer up, and applies equally to the
spec/domains/opportunities.md:730: expected a heading (### ID · vN · confidence · origin), got:   author and to administrators. So a Team With Us author can delete their own opportunity
spec/domains/opportunities.md:731: expected a heading (### ID · vN · confidence · origin), got:   after it has been submitted for review, which their Code With Us and Sprint With Us
spec/domains/opportunities.md:732: expected a heading (### ID · vN · confidence · origin), got:   counterparts cannot. There is no replacement criterion because whether the Team With Us
spec/domains/opportunities.md:733: expected a heading (### ID · vN · confidence · origin), got:   latitude was intentional is not recoverable from the code.
spec/domains/opportunities.md:735: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:737: expected a heading (### ID · vN · confidence · origin), got: ## Watching an opportunity
spec/domains/opportunities.md:739: malformed heading: ### D-opportunities-51 (v1) [confidence: inferred]
spec/domains/opportunities.md:740: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity and stop watching it, and shall
spec/domains/opportunities.md:741: expected a heading (### ID · vN · confidence · origin), got: show them whether they are currently watching it.
spec/domains/opportunities.md:742: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:743: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:36
spec/domains/opportunities.md:744: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:167
spec/domains/opportunities.md:745: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:746: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor viewing a published opportunity they do not watch
spec/domains/opportunities.md:747: expected a heading (### ID · vN · confidence · origin), got: - when: they choose to watch it
spec/domains/opportunities.md:748: expected a heading (### ID · vN · confidence · origin), got: - then: the control changes to show they are watching, and choosing it again stops the watch
spec/domains/opportunities.md:750: malformed heading: ### D-opportunities-52 (v1) [confidence: inferred]
spec/domains/opportunities.md:751: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to let a user watch an opportunity they authored.
spec/domains/opportunities.md:752: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:753: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:754: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:755: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee viewing their own published opportunity
spec/domains/opportunities.md:756: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to watch it
spec/domains/opportunities.md:757: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused with a message saying they cannot watch their own opportunity
spec/domains/opportunities.md:759: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:761: expected a heading (### ID · vN · confidence · origin), got: ## Notifications
spec/domains/opportunities.md:763: malformed heading: ### D-opportunities-53 (v1) [confidence: inferred]
spec/domains/opportunities.md:764: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall notify every administrator and
spec/domains/opportunities.md:765: expected a heading (### ID · vN · confidence · origin), got: the opportunity's author.
spec/domains/opportunities.md:766: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:767: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:768: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:769: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity
spec/domains/opportunities.md:770: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:771: expected a heading (### ID · vN · confidence · origin), got: - then: every administrator receives a notification, and so does the author
spec/domains/opportunities.md:773: malformed heading: ### D-opportunities-54 (v1) [confidence: inferred]
spec/domains/opportunities.md:774: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall notify every user who has opted in to
spec/domains/opportunities.md:775: expected a heading (### ID · vN · confidence · origin), got: opportunity notifications, and separately confirm the publication to the opportunity's author.
spec/domains/opportunities.md:776: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:777: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:778: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:779: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who has opted in to notifications
spec/domains/opportunities.md:780: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator publishes an opportunity
spec/domains/opportunities.md:781: expected a heading (### ID · vN · confidence · origin), got: - then: that vendor is notified of the new opportunity and the author is told the
spec/domains/opportunities.md:782: expected a heading (### ID · vN · confidence · origin), got:   publication succeeded
spec/domains/opportunities.md:784: malformed heading: ### D-opportunities-55 (v1) [confidence: inferred]
spec/domains/opportunities.md:785: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is cancelled, the system shall notify everyone watching it and every
spec/domains/opportunities.md:786: expected a heading (### ID · vN · confidence · origin), got: vendor with a proposal on it, and separately tell the author that the cancellation was
spec/domains/opportunities.md:787: expected a heading (### ID · vN · confidence · origin), got: carried out.
spec/domains/opportunities.md:788: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:789: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:790: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:791: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:792: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator cancels it
spec/domains/opportunities.md:793: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher and the proposal's author are notified of the cancellation, and the
spec/domains/opportunities.md:794: expected a heading (### ID · vN · confidence · origin), got:   opportunity's author is told it was cancelled
spec/domains/opportunities.md:796: malformed heading: ### D-opportunities-56 (v1) [confidence: inferred]
spec/domains/opportunities.md:797: expected a heading (### ID · vN · confidence · origin), got: The system shall address a recipient only once per notification even when they both watch an
spec/domains/opportunities.md:798: expected a heading (### ID · vN · confidence · origin), got: opportunity and hold a proposal on it.
spec/domains/opportunities.md:799: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:800: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:190
spec/domains/opportunities.md:801: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:802: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who both watches an opportunity and has submitted a proposal to it
spec/domains/opportunities.md:803: expected a heading (### ID · vN · confidence · origin), got: - when: the opportunity is edited
spec/domains/opportunities.md:804: expected a heading (### ID · vN · confidence · origin), got: - then: they receive one notification, not two
spec/domains/opportunities.md has no criteria