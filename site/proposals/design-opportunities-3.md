| Field | Value |
| --- | --- |
| gate | G-DESIGN |
| opened | 2026-10-02T01:08:58.803Z |
| holder | agent:ux-reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these screens serve the opportunities criteria, and are they built out of the design system?

**Recommendation.** The catalogue hasn't been compiled or scanned yet: the dependencies aren't installed here, so `design/report.json` from the pipeline's run after this turn is the first real check that the files still …

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've moved all 97 opportunities stories onto the shared page container and stack, and changed nothing but layout. The catalogue hasn't been compiled or scanned yet: the dependencies aren't installed here, so `design/report.json` from the pipeline's run after this turn is the first real check that the files still compile and pass the accessibility scan.

**What was redone.** The 97 stories cover every state of the home page, the dashboard, the opportunity list, program select, `/status`, and the create, view, manage and complete-report pages of all three programs. Before this pass none of them used `design/catalogue/layout.tsx`; each set its own page grid, padding and gaps. The content domain had already defined `PageContainer` and `Stack` there, and organizations and users use them, so I reused them unchanged rather than writing a second pair.

Each story now has one `PageContainer` holding one large-gap stack whose items are the page's regions. Inside that:
- **Sections and forms:** H2 sections are medium stacks, and a `Form` holds one medium stack.
- **Rows:** these are wrapping row stacks. The filter row and the score weights line up on their bottom edge; every other row is centred.
- **The project's own components:** cards, card sections and fieldsets keep only their border, radius and inner padding, with a stack inside. A fieldset's legend stays outside its stack.
- **Key facts:** a row stack of small stacks. The `xsmall` gap between label and value is gone; `small` is now the label gap everywhere.
- **Dialogs:** each `Modal` moved out of the page stack, and its body is one medium stack.
- **Wrappers carrying a test ID** (`home-page`, `service-status-page`, `not-found-page`): the outer stack now carries the ID.
- **Data tables:** left exactly as they were.

No story sets its own width, outer padding, margin or gap any more.

**What I chose.** A few spacing values had to change to follow one rhythm:
- **Heading block:** the small program line ("Code With Us opportunity", "Manage a … opportunity", "… opportunity report") and the H1 under it are grouped at the small gap, as organizations does.
- **Tabs and key facts:** both had used the large gap between items; they now use medium, matching users, content and organizations.
- **Complete report:** its sections now sit at the large gap, like the view pages' sections.
- **Two status rows:** in the Sprint With Us and Team With Us `editing` stories, the status row had picked up bottom alignment from a shared row style; I set it back to centred like every other manage page.

**What stayed the same.** No page, state, wording, component choice or test ID changed, and nothing in `spec/contract/surface.yaml` or `design/screens.yaml` was touched. I couldn't keep a copy of the originals, because copying files is blocked here. Instead I compared test-ID counts: 884 across 86 files, matching the count taken before any edit, file by file. Every one of the 97 files imports the layout and has exactly one outer large stack.

**How it was split.** I converted the reference set myself: home, `/status`, the list, dashboard, program select, the Code With Us manage default, view default, cancel dialog, loading and not-found. Three helper agents did the remaining create, view, manage and report stories for each program, following a written rule sheet and those references. I checked their output by grep, then read through a create-invalid story and a report story.

**`DESIGN.md`.** In the opportunities section:
- **Own components:** the page container and stack are now listed among the project's own components, and the entries for key facts, opportunity card, card section and fieldset group describe how each uses the stack inside.
- **"How a screen is laid out":** rewritten with the large, medium and small rhythm, the row rules, how dialogs and test-ID wrappers sit, and the tokens actually written.
- **New gap 26 (below).**

The components the stories lean on most are still the design system's: `Heading`, `Text`, `Button` and `ButtonGroup`, `Link`, the form fields (`TextField`, `TextArea`, `NumberField`, `DatePicker`, `Select`, `RadioGroup`, `Checkbox`, `Form`), `InlineAlert`, `Modal` with `AlertDialog`, and `ProgressCircle`.

**Gap found.** The surface now has observations on this domain's pages still set to `test_id: null` that no story binds:
- the separate key dates on the views and manage pages
- the successful proponent's contact details and score
- `scope_section`, `terms_section` and `evaluation_question_fields`
- `instructions_tab`, `evaluation_tab` and `offered_state_changes`

Binding them means adding or marking elements, which this layout-only run was ordered not to do, so I left them `null` and recorded them as gap 26 in `DESIGN.md`. They need a design run for this domain.

**Other domains.** The proposals and evaluation sections of `DESIGN.md` still describe the old single-column grid; that is theirs to update. Their stories don't use `layout.tsx` either.

**Leftovers.** The helper agents left two unused helper scripts in this session's scratchpad (`convert.py`, `twu/twu_convert.py`). They are outside the workspace and travel with nothing.

## Fix turn

Both failed checks are fixed: `opportunity-watch-request` and `opportunity-counters` now each have a screen.

**Journal addition.** The two pages had no entry in `design/screens.yaml`, no stories, and `null` test IDs in the surface, so I added them. Both are request addresses that answer with data rather than a page. I gave each two states, `default` and `refused`, and wrote four new stories as response references, built the same way as the organizations domain's `affiliation-approval-request`. Each one uses `PageContainer` and `Stack` from `layout.tsx`, the design system's `Heading` and `Text`, and a `dl` of request and answer.

- **Watch request.** The `default` story shows the watch and stop-watching requests and an accepted answer, with watching read back as Yes. The `refused` story shows an author asking to watch their own opportunity: it is filed under `opportunity`, carries R-1.5's message "You cannot subscribe to your own opportunity.", and watching stays No. I filled in its seven test IDs, from `opportunity-watch-request-watch` to `opportunity-watch-request-watching`.
- **Counters.** The `default` story shows an administrator reading the view count. The number shown is illustrative, and the story says a missing counter reads as 0. The `refused` story shows a vendor or a request with no session refused as not permitted. Its two test IDs are `opportunity-counters-view-count` and `opportunity-counters-refused`.

Every test ID appears in at least one story. In the opportunities section of `DESIGN.md` I added per-screen notes and the test-ID bindings, plus gap 27: R-1.5 gives no wording for the duplicate-watch refusal and no response status for any refusal. Because of that, the `refused` story shows the own-opportunity case and labels the status "Refused (the criteria do not state the status)" instead of making one up. I changed no other page, state, test ID or wording.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the opportunities screens serve their criteria, and are they built from the design system? Ruling: approve. The pipeline's scan (design/report.json) shows typecheck and build passing and no accessibility violations in any story. All 101 opportunities, home and scheduled-transition stories import PageContainer and Stack from design/catalogue/layout.tsx. A search of these stories found no hard-coded colour, no pixel value and no stray gap or margin. The only spacing they still set is a fieldset's margin to the --layout-margin-none token, the token padding and borders inside the project's own card, card-section and fieldset components, and the tables' relative 100% width, which was left as it was. I looked at the screenshots of home.default, opportunity-cwu-view.default, opportunity-list.default, opportunity-swu-edit.editing and opportunity-watch-request.refused. In each, the content sits in the shared container with its left edge on one line, and the spacing follows the large/medium/small rhythm without doubled margins. In the list, the filter row lines up on its bottom edge and the cards share one gap. The surface diff only fills in test IDs that were null for opportunity-watch-request and opportunity-counters, and no filled ID is changed. The four new response-reference stories follow the organizations domain's affiliation-approval-request pattern. They quote R-1.5's own refusal wording, and where R-1.5 states no response status the refused story labels the status as unstated rather than making one up, which is recorded as gap 27. Gap 26 records the observations still null in the surface as work for a later design run, which is acceptable because a screen or state missing from the catalogue is allowed. This ruling would change to a return if a later scan reports any accessibility violation, or if a story is found that sets its own width, padding or gap outside layout.tsx.

**Conditions:**
none
