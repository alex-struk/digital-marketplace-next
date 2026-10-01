---
stage: "build"
title: "build slice 8"
at: "2026-10-01T13:09:43.045Z"
cost: 10.726200200000003
turns: 190
session: "2f8666da-5b0b-4b8c-a500-4dc9c7266a16"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed one of the three returned criteria (R-1.39) and could not find the cause of the other two (R-1.3 and R-1.38). Both of those are unchanged and may come back the same way. `npm --prefix app run check` passes, but I couldn't run the sandbox: `docker compose` needed an approval nobody was here to give, so nothing was checked against the running application.

**R-1.39: built.** The check failed because `/opportunities/sprint-with-us/create` showed the not-found screen. Those screens belong to slice 10, and until now the service answered any permitted creation in Sprint With Us and Team With Us with 501. The surface only lets a test enter a title and the key dates, which is enough for a draft and nothing more, so I built the draft path in both programs:
- **Service:** both create addresses now save a draft from the fields all three programs share. As with Code With Us, a draft is never refused, and missing dates are set fourteen days ahead (R-1.9). The existing rules still hold: only public sector staff create (R-1.7), only an administrator creates one published (R-1.48), and an unknown state is refused. A permitted request to submit for review or publish is still answered 501. Without phases or resources, questions, weights and a panel, such an opportunity could only be incomplete. Reading one opportunity by its identifier now works too, under the same visibility rules (R-1.2, R-1.3).
- **Screens:** both create pages draw the stories' Overview, Budget, Description and Key dates sections with their test ids, plus Save draft and Submit for review (Publish for an administrator). A saved draft lands on a small interim manage page showing the title, state, identifier, key facts and who created and changed it. Only its author and administrators can open it.
- **Not drawn yet:** phases, resources, questions, weights, the evaluation panel and attachments. Their controls would accept nothing, so their test ids (`add-phase-button` and the rest) are not on the page.

The rules are in `rules/other-program-drafts.ts`. Decision record 0035 explains the choices, and 0034 and the README are amended to match.

**R-1.3 and R-1.38: not found.** Both checks read an empty value from the list. I seeded the same data the suite uses and recorded what the service actually answers the administrator, both staff members (after one created a draft), and a vendor. I then drew the real list and dashboard screens from those answers. Every persona saw the expected Unpublished, Open and Closed groups, including the other staff member's seeded draft and the new draft where they belong.

The only causes I can see are ones that only the running sandbox can confirm. Either the page is read before it finishes loading (an earlier ruling rejected that explanation for slice 2), or something in the real setup makes the list fail for staff and administrators. That second case fits what passed: every check of this slice that passed either asserts absence, which an empty value satisfies, or acts through a control, which waits for it. A useful first step for whoever can start the stack is to open `/opportunities` as `test-admin` and `test-gov` and see whether the groups appear or the "could not be loaded" alert does.

I also tried and withdrew a change that read the list ahead of time. Every link in this app reloads the whole page, so nothing read ahead would survive.

**Tests:** new unit tests cover the draft rules and the create decision. End-to-end service tests (against the real migrations and seed) cover saving both kinds of draft, who sees them, and the refusals. New screen tests cover both create pages, landing on the manage page with its identifier, the refusal message keeping what was typed, the not-found screen for a vendor, and an accessibility check.

**What slice 10 will find missing:** the Sprint With Us and Team With Us public pages, the full manage pages, and everything that makes those opportunities complete enough to submit or publish. It replaces my interim service code and both screens, keeping the R-1.48 check and R-1.9's draft defaults. The list's links to those programs' public pages still lead to not-found.

I changed nothing outside `app/` and `docs/decisions/`, and removed the `node_modules` I had installed.