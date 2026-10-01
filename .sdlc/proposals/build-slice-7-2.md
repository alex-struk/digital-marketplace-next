---
gate: G3
question: "Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?"
recommendation: "I couldn't run the application against either failure: the stack wasn't running, and I didn't start it."
opened: 2026-10-01T07:25:57.445Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I couldn't run the application against either failure: the stack wasn't running, and I didn't start it.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've revised slice 7 for R-1.48 and R-1.53. I couldn't run the application against either failure: the stack wasn't running, and I didn't start it. `npm --prefix app run check` passes, with every workspace's unit tests green. The R-1.53 fix answers its message exactly. The R-1.48 fix rests on an inference about which cause applies.

**R-1.53.** The suite couldn't find a field labelled "Remote OK" on the create page. The form asked "Is remote work acceptable?" as a Yes/No radio group with neither option chosen. I replaced that with a single checkbox labelled "Remote OK: remote work is acceptable". It starts unticked, which means remote work is not acceptable. Its error line in the summary now reads "Remote OK: …". This applies on the create page and on the manage page's Opportunity tab, which reuse the same form (`app/frontend/src/screens/opportunity-cwu-form.tsx`). The checkbox keeps the story's `opportunity-remote-field` test id, and the remote-work description is still required whenever the box is ticked. This departs from the design story, which draws a radio group.

**R-1.48.** The failure only said an expected value came back empty. I found two likely causes and fixed both:

- **Blank remote answer on the form.** With the old radio group, a person who never chose an option couldn't submit for review from the form, because R-1.11 refuses a blank answer to whether remote work is acceptable. A test as a non-administrator staff member would then never reach the manage page, so the opportunity's identifier would be empty. The checkbox always gives an answer, which removes that. The service still refuses a request that leaves it out. Starting at "not acceptable" also matches how the old application's form began.
- **The other two programs.** The criterion covers all three programs, but nothing answered creation for Sprint With Us or Team With Us. A new interim controller (`app/backend/src/opportunities/unbuilt-program-creation.controller.ts`) now applies the R-1.48 rule on both create addresses:
  - anyone who isn't public sector staff gets 401;
  - an unknown state gets 400;
  - a published creation by a non-administrator gets 401, with the same wording Code With Us uses.

  Creations that are permitted get 501, "not yet offered", because those opportunities belong to slice 10.

Decision record 0030 sets out both choices and what would reverse them.

**Unit tests.**
- **Backend:** a new test covers every branch of the interim refusal and checks the refusal shape.
- **Frontend:** a new test finds the checkbox by the name the suite looks for, shows it starts unticked, and shows ticking it sends `remoteOk: true` on a draft save.
- The existing submit-for-review test now also checks that no "Remote OK" problem is raised when the box is left alone.

**Not built, and what's not mine.**
- The success path of R-1.48 for Sprint With Us and Team With Us: whether staff can actually create a draft or an under-review opportunity there. That needs those programs' opportunities, which the plan gives to slice 10. If the suite checks it, R-1.48 will still fail, and the fix is to move that part of the criterion or build slice 10.
- Slice 10 should replace the interim controller with the programs' own create paths, keep the same R-1.48 check, and use the same "Remote OK" checkbox on its forms. The Sprint With Us and Team With Us stories still draw the radio group.
- I didn't touch the design catalogue or the spec; whether the stories should change to match the checkbox is for the design gate.

I installed dependencies only to run the check and removed them afterwards.
