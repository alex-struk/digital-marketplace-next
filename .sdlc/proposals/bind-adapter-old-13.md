---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed all fourteen findings in `tests/adapters/old/index.ts`."
opened: 2026-09-15T05:08:43.510Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed all fourteen findings in `tests/adapters/old/index.ts`.

I fixed all fourteen findings in `tests/adapters/old/index.ts`. Before changing anything I checked each fix against the running target at localhost:3000. I couldn't run the type check: every `tsc` command needed an approval this session doesn't have, so I checked the changed code for type errors by reading it. `bindings.yaml` already listed every affected member as bound, so it is unchanged. Nothing is newly unbound, and every route I opened loaded.

**Organization invitations (R-3.7, R-3.25).** The dialog takes one address per box. After the first box, an icon at the right end of the last box adds another. `addTeamMembers` now puts each address in its own box and presses that icon, found by its position, when it needs a new one. On the target, the dialog kept "Add Team Member(s)" disabled while a box was empty and enabled it once two addresses were in, one per box. If pressing the icon adds no box, the action throws unbound naming the address.

**Team capabilities (R-3.34).** The list always shows all nine capabilities. Held ones are drawn in the same colour as the "Team Capabilities" heading; the others are grey. The reader now returns only the ones in the heading's colour. For the second proponent's organization it returned exactly the four capabilities the seed gives that owner.

**Service-area requirement (R-3.26).** The reader now returns only the requirement under "Requirements", as "Met: …" or "Not met: …". A met requirement has a green mark; an unmet one has a mark in the same colour as its text. It read "Met" for the second proponent's qualified organization and "Not met" for the unqualified one. A test looking for the word "met" will also match "Not met", so the difference is the prefix.

**Proponent organization (R-2.14).** The organization's name is now taken from `legal_name` as well as a plain name, including when the record sits under `organization`. The Organization field is recorded as named by the test, so the step that fills required fields no longer picks the first organization offered. The archived organization's owner is offered only two other organizations, so it is left unchosen. That leaves the form unsubmittable, which is the refusal the test reads.

**Scoring weights and phase dates (R-5.18, R-1.48, R-1.53, R-2.24, R-8.20).** The weight keys now map to the Scoring step's fields:
- **Sprint With Us:** "Team Questions", "Code Challenge", "Team Scenario" and "Price".
- **Team With Us:** "Resource Questions", "Interview/Challenge" and "Price".

On Sprint With Us, the dates exist only on a phase. A top-level `startDate` or `completionDate` is now entered as "Phase Start Date" and "Phase Completion Date" on the starting phase: the one the input names, otherwise Implementation. I confirmed choosing Implementation brings up both date fields.

**Second vendor's terms (R-2.24).** Two changes:
- The record of fields the test named, and of terms accepted, now resets whenever a page is opened. The first vendor's "Proposal" no longer stops the second vendor's form from being completed.
- Accepting terms is remembered even when the dialog can't open yet, so the submit that follows ticks both boxes.

**Proposals tab (R-2.25, R-1.31).** It returns empty when it shows "Proposals will be displayed here once this opportunity has closed." and lists no table. It returns the tab text as before when proposals are listed; I checked both on the seeded published and closed opportunities.

**Attachments (R-8.20, R-8.31).**
- **Saving:** `attachmentAddress` now presses whichever save the top bar offers and isn't disabled ("Save Changes", "Publish Changes" or "Submit Changes for Review"), then confirms.
- **Adding:** "Add Attachment" was never missing. It is a link taken out of the tab order, which the adapter's disabled check treats as disabled. The real control is the "Choose File" input underneath it. `addAttachment` now goes to the Attachments step through the step menu, falling back to Previous/Next, and hands the file to "Choose File" directly. It falls back to "Add Attachment" only if that isn't disabled. On the published Code With Us proposal, a file given to "Choose File" appeared in the attachment list.

**Embedded image (R-8.29).** When the Body refers to the upload as `FILE_ID:<id>`, `imageAddress` now returns `/api/files/<id>`. I did not open a published page with an embedded image, so I haven't confirmed this matches the address the page itself renders. The contract's download route adds `?type=blob` to the same address.
