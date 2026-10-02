---
gate: G-DESIGN
question: "Do these screens serve the notifications criteria, and are they built out of the design system?"
recommendation: "I moved all fourteen notifications stories onto the shared page container and stack."
opened: 2026-10-02T00:20:53.370Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the notifications criteria, and are they built out of the design system?

**Recommendation.** I moved all fourteen notifications stories onto the shared page container and stack.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I moved all fourteen notifications stories onto the shared page container and stack. I changed layout only. Every page, state, test ID, component choice and line of wording is the same as before. I couldn't compile or scan the catalogue in this workspace because its dependencies aren't installed. The pipeline does both when this turn ends, and the last report (`design/report.json`) came back clean.

**What changed in the stories.** All four of this domain's pages now have their stories in line:
- `notification-unsubscribe-landing`: default, loading, unsubscribed, sign-in-required
- `notification-optin-opportunity-list`: default, subscribed, signed-out
- `notification-terms-broadcast`: default, notify-confirm, notified, notify-failed
- `notification-email-reference`: default, loading, not-found

Each story is now wrapped in `PageContainer`, with one `Stack gap="large"` holding the regions of the screen. Before, each story had its own wrapper with its own padding and spacing. No story now sets its own width, outer padding, margin or gap.

Spacing follows the layout rule's three-step rhythm: large between regions, medium between items in a region, small between a label and what it labels. Rows that used to be hand-built flex boxes are now wrapping row stacks: the profile section links, the filter row, the opt-in card and the loading rows. The only spacing a story still writes is the inner padding of its bordered frames, the rule between sample emails, and the status badge's own padding.

**Two small visible shifts:**
- On the terms page, the gap between "Manage a page" and the H1 is now small instead of medium.
- On the settings page, the profile section links are now spaced medium instead of large.

**Layout component.** `PageContainer` and `Stack` already existed in `design/catalogue/layout.tsx`. The content domain wrote them, and I reused them as they were apart from one addition. I added an `align="end"` option to `Stack` so the filter row reproduced around the opt-in still lines its controls up on their bottom edge. The change is additive and no other domain's story uses it. It is described in `DESIGN.md`.

**`DESIGN.md`.** I added to the notifications section and replaced nothing:
- Container and stack are now listed among the project's own components.
- The layout section opens with the container-and-stack rule and the rhythm for this domain's screens.
- The token list now includes `--layout-padding-medium`, which the container uses.
- There is a note on the four mail-catcher entries and a new gap 14.

**Mail-catcher pages.** The brief also gave this domain `caught-message`, `caught-message-list`, `mail-delivery-fault` and `mail-delivery-delay`. All four are marked `origin: mail-catcher` in the contract, meaning the test harness's mail catcher serves them, not the application. No screen renders them, so there are no states or stories for them, and their test IDs stay `null`. A test ID there would name an element that appears in no story. Gap 14 asks the contract stage to say whether those fields apply at all.

**Untouched.** I filled in no new test IDs and changed none in `spec/contract/surface.yaml`, because every action and observation on the four designed pages already had one. `design/screens.yaml` is unchanged. Gaps 1 to 13 from the earlier design still stand as written, including the superseded name `notification_control_hidden_on_narrow_screen` and the conflict between R-6.6 and R-6.16. The components I relied on most are all from the design system: `Heading`, `Text`, `Button`, `InlineAlert`, `Modal` with `AlertDialog`, `ProgressCircle` and `Checkbox`.

## Fix turn

All four check failures are fixed: `caught-message`, `caught-message-list`, `mail-delivery-fault` and `mail-delivery-delay` now each have a screen. The earlier design had left them out on purpose, because they belong to the mail catcher (`origin: mail-catcher`) and the service never renders them. The check now requires a screen for every entry in the surface. I gave each one a single `default` state in `design/screens.yaml`, below this domain's existing entries.

Every declared state needs a story, so I wrote one for each at `design/catalogue/<page>.default.stories.tsx`. I followed the files domain's approach for its service addresses: each story is a response reference showing the request and the parts of the catcher's answer that the surface reads, described only from the surface's own comments. Each uses `PageContainer` and `Stack` from `design/catalogue/layout.tsx` and the design system's `Heading` and `Text`, and sets no width, padding or gap of its own.

The check did not mention test IDs, so I filled none in. The `test_id`s on these four entries in `spec/contract/surface.yaml` stay `null`, and the stories carry none. Gap 14 is still open: the contract stage should rule whether a test ID belongs on a mail-catcher entry at all.

In `design/DESIGN.md` I rewrote the paragraph that said these entries had no screen and no story, and the matching sentence in gap 14, so both now describe the response-reference stories. I changed nothing else in the existing stories, the other entries or the test IDs.
