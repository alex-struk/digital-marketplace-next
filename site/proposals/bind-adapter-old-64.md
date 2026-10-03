| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T00:13:55.138Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed the `opportunity-swu-view.page_messages` reader in `tests/adapters/old/index.ts` so it only reports messages shown outside the screen's own sections, which is what the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed the `opportunity-swu-view.page_messages` reader in `tests/adapters/old/index.ts` so it only reports messages shown outside the screen's own sections, which is what the ruling asked for. Nothing else in the adapter or in `bindings.yaml` changed; `page_messages` was already listed there as `bound` and still is. One gap: I could not run the TypeScript typecheck, because the command needed an approval nobody was present to give. The rest of the adapter is unchanged.

**How the new reader works.** The old reader returned every alert on the page. The new one first finds the screen's section regions using only roles and visible text:
- **The tabbed region:** found from the list holding a "Scope & Contract" item. It covers the tabs "Details | Scope & Contract | Attachments | Addenda" and the body under them, which is what `scope_section` and `addenda` read.
- **The two blocks below it:** found from their headings, "Budget" and "Phases of Work". For safety it also accepts the headings "Phases", "Attachments" and "Addenda", though on the pages I looked at those only appear inside the tabbed region.

Each region is the largest part of the page around its anchor that still leaves out the opportunity's title. Any alert inside one of those regions is skipped. Every other alert is still read, wherever and whenever it is drawn, one line per message in page order. That includes alerts that appear late, below the sections or after the footer. The not-found and page-did-not-open cases still throw `unbound:`, and the reader still makes no assertions. The comment above it now says what is left out and why.

**What I checked on the running target**, signed in as vendor 1 and running the same locator logic through the browser tool:

| Page | Result |
|---|---|
| Seeded awarded Sprint With Us opportunity | Still returns "This opportunity was awarded to Northern Pines Digital Ltd..", because that notice sits above the header, outside every section region. |
| Seeded closed Sprint With Us opportunity, "Scope & Contract" tab open | Returns nothing, as the contract expects for this record and persona. |
| Same page, with three test alerts I inserted (inside the "Scope & Contract" tab body, under "Phases of Work", and at the very end of the page) | Only the end-of-page alert is returned; the two inside sections are left out. |

Every route I opened resolved on the target. I touched no file outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised opportunity-swu-view.page_messages reader binds the contract's observation (messages shown outside the screen's own sections) and nothing else, settling bind-adapter-old-63#1. It does. In the old app's SWU view (sources/old/src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx:815-825), Header (holding the h2 title), Info (the tabbed region), Budget and Phases are siblings in one container, with How To Apply outside it. The reader climbs from each anchor (the tab list, or the Budget/Phases of Work headings) to the widest ancestor that excludes the title, which in that tree is each section's own root div. Alerts in the header, the award notice, How To Apply or after the footer are therefore still read, and alerts inside the tab body, Budget or Phases are skipped. The binding uses roles and visible text only, makes no assertion, keeps the unbound throws for not-found and page-did-not-open, and its comment says what is excluded and why. Nothing under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/old/. The author's runs on the target (award notice still returned, closed record empty, injected in-section alerts skipped and an end-of-page alert kept) agree with this reading. The missing test owed for R-7.29 belongs to derive-tests and stays open. The ruling would change on evidence that an alert outside every section is dropped, or that a region climbs into the header.

**Conditions:**
- condition-met bind-adapter-old-63#1: the pageMessages reader in tests/adapters/old/index.ts (opportunity-swu-view, added after assignmentDate) now skips role=alert elements inside the tabbed region (anchored on the list holding 'Scope & Contract') and inside the Budget and Phases of Work blocks (anchored on their headings), each region bounded so it excludes the opportunity title. It still reads every other alert, including late-drawn ones, in page order, and the comment above it states what is excluded and why.

### Runner-owned typecheck evidence

Proposal revision: `8a5d004ae12040aef98f890e1bcce462cdd041ed`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
