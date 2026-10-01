---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T08:15:13.744Z"
cost: 1.3772984000000006
turns: 56
session: "8f12bc0b-9aa0-4e85-a0b5-79f853ecdcf2"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've fixed the Opportunity tab reader the ruling named. The two Sprint With Us and Team With Us create pages behind R-1.48 are still unbound, because the running target still doesn't serve them. I couldn't run the type checker: both attempts needed an approval that nobody here can give.

**The Opportunity tab reader (request 1).** On the Code With Us management screen, the Opportunity tab is the editing form itself. The old reader took only the panel's visible text, which never includes what is typed in the boxes. So Verify got the labels ("Title(required) … Is remote work acceptable? (required) Yes …") but no saved description or location. The reader now returns that same text, followed by one `<label>: <value>` line for each field in the panel:
- **Text boxes and text areas:** their current value.
- **Radio groups:** the chosen answer.
- **Ticked checkboxes.**
- **Lists:** the chosen options.

The skills list needed extra handling: it is a hidden list behind a "Skills (required)" button, and its own label is empty. So it takes its name from what that button is labelled by.

I checked the logic on the seeded published Code With Us opportunity, signed in as the administrator. It returned the title, teaser, location ("Victoria"), "Is remote work acceptable? (required): Yes", the remote-work description, the reward, "Skills (required): Backend Development, Frontend Development", the full description and all four key dates. To stay clear of the separation check, it finds fields only by element type and their labels, never by attribute or CSS selectors.

Only `opportunityTab` uses the new reader. The Summary, Addenda and History readers, and every other member, are as they were. R-1.4, R-1.21 and R-1.56 should now get the saved values.

**R-1.48.** I looked again, signed in as the administrator and then as a public sector employee:
- **Address typed directly:** both `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` answer "Page not found".
- **From the program chooser:** `/opportunities/create` does offer "Create a Sprint With Us opportunity" and "Create a Team With Us opportunity" links. Following either one also lands on "Page not found".

Both pages stay unbound. Their reasons in the adapter now say this second search was made, chooser links included. `bindings.yaml` is unchanged: both pages were already listed as unbound with a reason that still holds.

**Routes that don't resolve:** `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create`. They answer "Page not found" to every persona tried.

Nothing outside `tests/adapters/new/` was changed, and no request is deferred.