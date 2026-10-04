# 0059 · A Sprint With Us phase carries its own maximum budget and required capabilities (slice 15)

- Status: accepted for the build (slice 15, revision)
- Date: 2026-10-04
- Builds on: 0035, 0045, 0058

## Context

R-2.19 holds a Sprint With Us proposal to each phase's maximum budget and each phase's required
capabilities, and the proposal form shows which phase is incomplete or which cost is over its
budget. The kept tables already record both (`swuOpportunityPhases.maxBudget`,
`swuPhaseCapabilities`), and the service already kept and returned them, but the opportunity form
asked only for each phase's dates. Every opportunity published through the form therefore had no
phase capabilities and phase budgets of 0 (inception and prototype) or the whole total
(implementation), and the proposal form had nothing to judge a phase against. The old
application's phase form asks for both. The catalogue story for opportunity-swu-create draws only
the dates in each phase group; the criterion, not the story, settles what the group must ask.

## Decision

Each phase group on the Sprint With Us create form and the Opportunity tab's edit form asks, after
its dates, for **Maximum budget** (a currency box, `data-testid="phase-max-budget-field"`,
`id="opp-<phase>-budget"`) and **Required capabilities** (one checkbox per capability in the
service's list, `rules/users.ts` `CAPABILITIES`, `data-testid="phase-capabilities-field"`). The
request carries them inside the phase as `maxBudget` and `requiredCapabilities`, and an edit starts
from what is kept (a phase budget of 0 reads as a blank box).

The budget box is optional, so opportunities and tests that give no phase budget behave as before:
left blank, the inception and prototype phases record 0 (held to the total alone by the proposal
rules) and the implementation phase records what the others leave of the total. When given, a
phase budget must be a whole number of at least $1; this is checked when the opportunity goes for
review or is published, never on a draft. The phase budgets are not held to the total maximum
budget: no criterion refuses phase budgets that together exceed it, and the old application accepts
such an opportunity. A proposal is held to each phase's budget and to the total separately
(R-2.19), so a proposal within every phase budget but over the total is refused against the total
alone. Capabilities are not required: a phase may require none.

## Consequences

The acceptance adapter fills the phase group's maximum budget box and ticks each named capability
in that group; that binding is the adapter's stage, not this one.
