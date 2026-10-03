| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T14:45:38.119Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The typecheck needs approval that this unattended session can't get.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've changed the profile-picture picker in `tests/adapters/new/index.ts` so it also drives the organization logo, but I couldn't compile or run the edited code. The typecheck needs approval that this unattended session can't get. I checked the change by reading it against the helpers it calls, so the first verify run will be the first real test of it.

**What I found.** I signed in as the seeded organization owner and opened `/organizations/create` and `/organizations/<id>/edit` for the seeded organization ending ...304.
- **The picker:** both screens draw a group called "Logo (optional)". It holds the JPEG/PNG rule, a note that logos over 500 pixels are shrunk, and a "Choose a logo (optional)" button (it reads "Choose a different logo" once a logo is held or chosen). On the edit screen the group only appears after pressing "Edit organization" in the "Organization" section.
- **The button works:** unlike the profile-picture button, this one does open a file chooser.
- **Upload, preview and refusal:** a chosen file shows as "Preview of <name>, the new logo". A refused file (a text file) shows an alert in the group starting "<name> cannot be used as a logo". With the form closed, the saved logo is an image named "<legal name> logo".
- **Resizing:** an 800×400 PNG I saved came back stored at 500×250, so the width and height reads have something real to measure.

**What I changed.** When the browser is on either organization screen, the picker now uses the logo instead of reporting unbound. It doesn't jump to `/users/me`.
- **Opening the form:** on the edit screen it switches to the "Organization" section if the logo isn't showing, and presses "Edit organization" when it needs the form.
- **Button match:** the button pattern now accepts the "(optional)" suffix.
- **Stored-image reads:** the address, current image, signed-out check, width and height now read the "<legal name> logo" image and skip the preview of a chosen file. The preview and refusal reads already matched the logo screens.
- **Profile path:** on any other screen the picker still uses the profile picture, unchanged.

`bindings.yaml` is unchanged, because every file-image-picker member was already listed as bound.

**The other criteria listed (R-3.2, R-3.6, R-3.15, R-3.23).**
- **R-3.6, R-3.15, R-3.23:** I opened the "Team members" section of organization ...304 again as its owner. It still shows only its heading and "This section is not available yet.", with no controls or member rows. So `organization-edit.add_team_members` and `owner_badge` stay unbound with the reasons they already had.
- **R-3.2:** `organization-create.create_organization` was already bound. Its unbound message was recorded on a different instance, at localhost:4500, where `/organizations/create` answered "Page not found". On this target the page opens normally for the owner, with the logo group, so I changed nothing for it.

**Side effect.** To see how a stored logo is drawn, I saved a logo onto the seeded organization "Salt Marsh Labs Ltd." (...304), which had none. I found no way to remove it. If a test expects that organization to have no logo and the seed isn't reloaded before the next run, it will now show one.

No page's route failed to load on this target. I changed nothing outside `tests/adapters/new/` and deferred none of the requests.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Approve. The diff touches only tests/adapters/new/index.ts and nothing under tests/acceptance. The change is navigation and locators only: on /organizations/create and /organizations/<id>/edit the file-image-picker opens the Organization section and the 'Edit organization' form, accepts the '(optional)' button suffix, and reads the stored '<legal name> logo' image within main while skipping 'Preview of' images. No assertion or pass/fail logic was added. The profile-picture path is unchanged apart from requiring the group to hold its button and scoping the stored-image read to main. The runner-owned typecheck on revision de8a87297 passed with no diagnostics under adapters/new/, which settles the author's point that it could not compile. The remaining unbound reasons are real and name what the surface lacks: the Team members section of organization ...304 renders only 'This section is not available yet.', so organization-edit.add_team_members and owner_badge cannot be bound for R-3.6, R-3.15 and R-3.23. That gap is already filed against plan. R-3.2's create_organization was already bound, and its unbound record came from another instance where the route did not exist. This proposal carries out the bind-adapter revision request from build-slice-11-3. The build-owed instructions build-slice-11-3#1 and #2 concern app code and are not settled here, so they stay open. The logo the binding run saved onto seeded organization ...304 is a seed-reload concern for the runner, not an adapter defect. What would change this ruling: a verify run showing the logo bindings read the wrong element, or that the profile path no longer finds its button or stored picture after the pickerForm and main scoping.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `de8a87297288c6e0aef915a1a4c00873c7292392`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
