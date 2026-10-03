# 0046 · The panel tab is its own surface, and the create form's panel starts as its story draws it

- Status: accepted for the build (slice 10, revision)
- Date: 2026-10-02
- Amends: 0045 ("The screens")

## Decision

**The Evaluation panel tab carries its own document title.** design/DESIGN.md says the document
title is always the surface title. `?tab=evaluationPanel` on a Sprint With Us or Team With Us manage
page is a surface of its own (`evaluation-panel-swu`, `evaluation-panel-twu`, titled "Evaluation
Panel"), so while that tab is open the document title is "Evaluation Panel"; on every other tab it
stays "Manage a … opportunity". This is the pattern the profile's tabs already follow.

**The create form's panel starts with two members to choose, each an evaluator, neither the chair**
— the `opportunity-swu-create` and `opportunity-twu-create` stories' starting state. It used to
start with the author already chosen and ticked as chair, which a person (or anything driving the
form) completing the panel from the story's shape would leave behind as a second chair. A row with
nobody chosen is not a member: the request already left it out, and now the form's own check
leaves it out too (`createPanelProblems`). So a panel of one chosen person is refused as too small
(R-1.55, R-5.1), not for its empty second row, and a member's problem is still numbered by its row.
A draft saved with nobody chosen gets its author alone, as 0045 says.

**Each program's question stages are named in the program's words** on the status badge, as the
stories and design/DESIGN.md's evaluation section write them: "Team questions: individual
evaluation" and "Team questions: consensus" for Sprint With Us, "Resource questions: …" for Team
With Us (`statusLabel`, R-1.19 note). Code With Us has no question stage and is unchanged. The
History tab's rows still use the shared wording.

**The Resources section is named by its heading.** Its `aria-labelledby` pointed at the section
itself rather than at its "Resources" heading, so it had no usable name.

## What would reverse it

A surface entry that makes the panel tab part of `opportunity-*-edit` rather than a page of its
own; a story that starts the create panel with its author chosen.
