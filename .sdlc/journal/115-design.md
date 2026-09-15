---
stage: "design"
title: "design: post-checks failed"
at: "2026-09-15T07:54:21.321Z"
cost: 3.336432
turns: 160
session: "86052999-dc6b-4b45-b45a-522c1da4a1ff"
---

I fixed the accessibility violation and moved the shared module so the catalogue holds only stories. I could not install the packages, compile the catalogue or run the accessibility scan, so the conditions that ask to show zero violations are still unmet. The package manager needed approval every time and never got it: installing into the scratchpad was refused, and so was a plain registry query. I did not try to get around that.

**What changed.** Only the parts the conditions name. No screen was redrawn, no state was added or removed, and no test ID changed.

- **The violation.** The error-summary wrapper in the shared module now has `role="group"` alongside `tabIndex=-1` and `aria-labelledby`. ARIA allows a name on a group, so when focus lands on the summary it is announced as "There is a problem with this form". This affects the four invalid-form states (`user-profile.invalid`, `user-profile-self.invalid`, `user-sign-up-complete.invalid`, and the same summary wherever it renders). DESIGN.md's forms section says why the role is needed, and the accessibility table gains a row for 4.1.2 (a name only on an element whose role allows one).
- **Gap U-19, the shared module.** It moved from `design/catalogue/users.shared.tsx` to `design/users.shared.tsx`. I changed the import in all 53 stories to `../users.shared` and checked afterwards: no story still uses the old path, and nothing anywhere refers to the old location.
- **Stray story files.** I did not expect these. `design/catalogue/` held 19 story files that screens.yaml does not declare, dated after the reviewed version. Examples are `user-profile.own`, `user-sign-out.loading`, `user-sign-up-complete.save-failed` and several `*.section-unavailable` and `*-confirm` files. They were not part of this design: they use a different identifier scheme, raw CSS custom properties and a non-design-system `FileTrigger`. The check refuses an undeclared story, so I removed them. Copies are in this session's scratchpad. They are recorded as U-21. The catalogue now holds exactly the 53 declared stories and nothing else.
- **The six native patterns.** DESIGN.md now has a table of patterns sent to the tech lead, E-1 to E-6: data table, section navigation, status label, file input, account-choice card and loading message. For each it gives the component it stands in for, where it is defined, and the accessibility it carries. Gap U-2 now points to that table and says this gate does not approve them.

**Still open.**
- **Gap U-1:** it now says plainly that no package was installed and no prop or token name was confirmed or renamed. The list of names to check is unchanged.
- **Gap U-20 (new):** no automated accessibility scan has been run, so zero violations is not shown. The error-summary fix is checked against the ARIA 1.2 rules, not by a tool. The entry says what the scan must cover: every story in its full state, including open dialogs, run in a real browser so colour-contrast results count. A note under the accessibility table says the same, so nobody reads it as a scan result.

**Conditions I left, and to whom.**
- **Install, compile and scan (U-1, U-20):** to whoever runs the pipeline or has package-manager access. This stage could not do it.
- **Ruling on the six native patterns:** to the tech lead. DESIGN.md records the escalation, but actually getting it to them is for the runner.
- **Gap U-16, test IDs against rule J3 of the constitution:** to whoever owns the constitution.
- **Spec gaps U-6 to U-12, U-17 and U-18:** to the spec owners.

None of these three last items was touched.

**Test IDs.** Unchanged: 125 of 126 filled. `user-sign-up-complete` `job_title_field` is still `null`, explained under gap U-5. The removed stray files carried none of the identifiers in `spec/contract/surface.yaml`.

**Components leaned on most.** Still the design system's `TextField`, `Checkbox`/`CheckboxGroup`, `Button`/`ButtonGroup`, `InlineAlert`, `Modal` with `Dialog`, `Link`, `Form`, and `Header`/`Footer`. Beyond those, only the six escalated native patterns, a `dl` for the account summary, and a visually hidden text helper.

## Fix turn

I made no changes on this pass, because the 19 story files the check refused are no longer in the workspace.

Each one it named, such as `user-profile.own`, `user-sign-out.loading` and the `*.section-unavailable` stories, was an undeclared file left over from an earlier attempt. That attempt used a different naming scheme. The previous revision deleted them and recorded it as gap U-21 in `design/DESIGN.md`, so the check must have run on the catalogue before they were removed.

I couldn't run a script to compare the two lists (it needed approval I didn't have), so I checked by hand:
- **`design/catalogue/`:** it holds exactly 53 files, all ending in `.stories.tsx`, and nothing else.
- **`design/screens.yaml`:** it declares 53 states across the fourteen users pages.
- **Match:** every story matches a declared state by page and state name, and every declared state has a story.
- **Earlier return:** the shared module is now at `design/users.shared.tsx` and all 53 stories import it from there (U-19). The error-summary wrapper now has `role="group"`, so its name is allowed.

I didn't touch `screens.yaml`, the stories, `DESIGN.md` or `spec/contract/surface.yaml`, since nothing the check named still exists to fix.

Two conditions from the return are still unmet, and `DESIGN.md` records both:
- **Packages and compile (U-1):** the three `@bcgov/*` packages were not installed and the catalogue was not compiled, so the prop and token names are still unchecked.
- **Accessibility scan (U-20):** no scan has been run, so zero violations is still claimed, not shown. The fix above is reasoned against ARIA 1.2, not scanned.

Both need whoever can install packages and render the stories in a browser. The six native patterns that stand in for missing design-system components go to the tech lead. The test-ID question under the constitution (U-16) and the spec gaps U-6 to U-12, U-17 and U-18 stay with their owners.

**Journal addition:** This pass changed nothing. The 19 files the check refused had already been deleted in the previous revision (U-21), and a hand count shows `design/catalogue/` holds exactly the 53 stories that `design/screens.yaml` declares, with nothing else in the folder. The scripted comparison could not be run without approval. Still open: installing the design-system packages, compiling the catalogue and scanning it for accessibility (U-1, U-20), for whoever can install and render. Also open: the six native patterns, for the tech lead, and U-16, U-6 to U-12, U-17 and U-18, for their owners.

design/catalogue/user-list.not-found.stories.tsx: no screen declares this page and state
design/catalogue/user-notice.sign-in-failed.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-capabilities.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-legal.accept-terms-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-legal.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-notifications.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-notifications.unsubscribe-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-capabilities.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-legal.accept-terms-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-legal.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-notifications.unsubscribe-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self.deactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.admin-refused.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.deactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.deactivated-by-admin.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.own.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.reactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-sign-out.loading.stories.tsx: no screen declares this page and state
design/catalogue/user-sign-up-complete.save-failed.stories.tsx: no screen declares this page and state
design/catalogue/user-list.not-found.stories.tsx: no screen declares this page and state
design/catalogue/user-notice.sign-in-failed.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-capabilities.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-legal.accept-terms-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-legal.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-notifications.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-notifications.unsubscribe-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-capabilities.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-legal.accept-terms-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-legal.section-unavailable.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self-notifications.unsubscribe-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile-self.deactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.admin-refused.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.deactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.deactivated-by-admin.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.own.stories.tsx: no screen declares this page and state
design/catalogue/user-profile.reactivate-confirm.stories.tsx: no screen declares this page and state
design/catalogue/user-sign-out.loading.stories.tsx: no screen declares this page and state
design/catalogue/user-sign-up-complete.save-failed.stories.tsx: no screen declares this page and state