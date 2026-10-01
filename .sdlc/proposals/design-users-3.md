---
gate: G-DESIGN
question: "Do these screens serve the users criteria, and are they built out of the design system?"
recommendation: "I changed the users section of `design/DESIGN.md` so it matches R-4.29."
opened: 2026-10-01T02:01:28.790Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the users criteria, and are they built out of the design system?

**Recommendation.** I changed the users section of `design/DESIGN.md` so it matches R-4.29.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed the users section of `design/DESIGN.md` so it matches R-4.29. Nothing else needed to change: the stories, `design/screens.yaml` and the surface's test IDs were already in line with the criterion.

**What was wrong.** In three places the users section said the "Stop emails about new opportunities?" question was asked both when someone unticks the new-opportunities checkbox on their profile and when they arrive from a message's unsubscribe link. R-4.29 asks for confirmation only on arrival from the link. From the profile, the box can be turned on or off at any time.

**What I changed:**
- **"Controls that save immediately":** removed the sentence saying that turning notices off from the notifications section asks first. It now says the checkbox turns on or off at any time, saves at once, and asks nothing in either direction. Only arrival from the unsubscribe link asks first.
- **"Confirmation dialogs":** the list of changes that ask first now names stopping notices only on arrival from the unsubscribe link, and states that unticking the checkbox does not ask.
- **The notes on `user-profile-notifications` and `user-profile-self-notifications`:** they now say the checkbox saves at once with no question. The `unsubscribe-confirm` state is the question asked only on arrival from the link, and nothing changes until it is confirmed.

**What I checked and left alone:**
- **The stories:** both `unsubscribe-confirm` stories already describe arriving from a message's unsubscribe link. The two `default` stories show the checkbox, the status region and no dialog, so they already match the criterion.
- **`design/screens.yaml`:** the `unsubscribe-confirm` state is still a real state for both pages, because the link opens the page with the question already asked. Its entries are unchanged.
- **`spec/contract/surface.yaml`:** no test ID depended on the claim I removed, so the test IDs stay as they were.
- **The notifications domain's section of `DESIGN.md`:** its "Unsubscribing asks first" passage only describes the landing page reached from the link, which agrees with R-4.29. I left it untouched.

**Gaps and conditions.** I found no new gap. The ruling's single condition was addressed to this stage and is taken up here. No condition was addressed to a person, so none were left for anyone else. I did not touch anything under `spec/`, `constitution.md` or `.claude/skills`.

**Components.** No component changed. The screens still rest on the design system's `Checkbox`, `Modal` with `AlertDialog`, `Button`, `Text`, `Heading` and `Link`.

## Fix turn

**Journal addition.** The checks failed because three users-domain addresses in the contract, `user-list-request`, `user-account-self-request` and `user-account-request`, had no entry in `design/screens.yaml`. I added an entry for each, under the existing users entries; no other domain's entries changed. All three answer with data, not a page, so I followed the pattern the files domain already uses for its service addresses. Each story is a response reference built from the design system's `Heading` and `Text` plus a plain description list. It shows the request and the parts of the answer the contract names, and each part carries its test ID.

Each address got only the states that are genuinely different answers:
- **`user-list-request`:** `default` (an administrator gets every account) and `refused` (anyone else, per R-4.21).
- **`user-account-self-request`:** `default` (identifier and notices-since, which is empty when notices are off) and `signed-out` (no account at all).
- **`user-account-request`:** `default` (the owner or an administrator) and `refused` (anyone else, per R-4.25).

That makes six story files under `design/catalogue/`. In `spec/contract/surface.yaml` I filled in the eight test IDs for these addresses:
- `user-list-request-accounts`, `-refused` and `-refusal-status`
- `user-account-self-id` and `user-account-self-notices-since`
- `user-account-notices-since`, `user-account-refused` and `user-account-refusal-status`

Every one of them appears in a story. Under the users domain's per-screen notes in `design/DESIGN.md` I added a paragraph explaining the three addresses. I also added gap 11: the criteria give no status number for a refused request, and don't say whether a signed-out visitor gets the same refusal as a signed-in person without permission. So the stories say "Refused: not permitted" and leave the number open.

The R-4.29 ruling (build-slice-3-3) was already reflected in the notifications notes, so I didn't touch it again. Those notes say the box turns notices on or off at any time with no question, and the confirmation is asked only on arrival from the unsubscribe link. No request was deferred, and no condition was addressed to a person.
