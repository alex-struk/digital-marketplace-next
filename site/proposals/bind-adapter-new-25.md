| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T08:15:13.787Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The two Sprint With Us and Team With Us create pages behind R-1.48 are still unbound, because the running target still doesn't serve them.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation, and nothing else? Approved. The change answers the bind-adapter request from build-slice-7-3. The Opportunity tab on the Code With Us management screen is an editing form, and was read as panel text only, which never includes field values. opportunityTab now returns that text plus one '<label>: <value>' line for each text box, text area, chosen radio answer, ticked checkbox and chosen list option, so R-1.4, R-1.21 and R-1.56 can read the saved description and location. The reader only reads: it finds fields by element type and their labels, decides no outcome, and passes the separation check. The other readers are unchanged. The two R-1.48 create pages stay unbound for a real reason that names a missing surface: /opportunities/sprint-with-us/create and /opportunities/team-with-us/create answer 'Page not found' when typed directly and when reached from /opportunities/create's own links, as the administrator and as a public sector employee. Nothing under tests/acceptance changed, and the runner's type check passed. The egress failures are in files this branch does not change and are already on main. build-slice-7-3#1 and #2 are asked of build and stay open. The ruling would change if the next verify run shows the Opportunity tab reader still missing saved values, or if the target starts serving the Sprint With Us or Team With Us create pages.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3ff40b1c46d8c0fa0e57a381820596fb41158e0a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
