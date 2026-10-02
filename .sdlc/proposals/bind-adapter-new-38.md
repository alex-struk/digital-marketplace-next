---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I took up both conditions in `tests/adapters/new/`; I couldn't run the typechecker because both attempts needed an approval nobody was here to give."
opened: 2026-10-02T05:07:52.519Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I took up both conditions in `tests/adapters/new/`; I couldn't run the typechecker because both attempts needed an approval nobody was here to give.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I took up both conditions in `tests/adapters/new/`; I couldn't run the typechecker because both attempts needed an approval nobody was here to give.

**Condition 1: opportunity list group readers.** I opened `/opportunities` on the target signed out. The groups are headed "Open" and "Closed", each on a line of its own, and each word appears only once on the page, so no card status gets mistaken for a heading. I changed the heading patterns the three group readers share to match the bare "Unpublished", "Open" and "Closed". They still accept the older "… opportunities" form, and a heading must make up the whole line, so a card title that merely starts with one of those words can't be taken for a group. The opportunity status reader uses the same patterns, so it now starts at the right place too. I did not see the "Unpublished" heading myself: it only shows to staff and I did not sign in this run. That part relies on the condition's report of the staff story.

**Condition 2: reading the answer at the service level agreement link.** I confirmed that `/learn-more/code-with-us` has a "service level agreement" link to `/content/service-level-agreement`. That page carries no such link, and its main area shows the title, the published and last-updated dates, the body and the page's address. The adapter now remembers where following the link landed. If the answer reader is called on that page, it returns the main text of the page it is on instead of looking for the link again. Otherwise it behaves as before: it follows the link if there is one and reads empty if there isn't. Opening the page clears the remembered landing spot.

**Also changed for consistency:** in `bindings.yaml`, `follow_service_level_agreement_link` was still listed as unbound, with a reason saying no page carries such a link. The live page now has the link, and condition 2 assumes this step navigates. I changed it to `bound` and rewrote the comment above it, since leaving it would contradict condition 2. The adapter code for that action did not need to change.

Nothing else in the adapter or the bindings file was touched, and I wrote nothing outside `tests/adapters/new/`. Every route I opened resolved.
