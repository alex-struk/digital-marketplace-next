---
stage: "bind-adapter"
title: "bind-adapter: post-checks failed"
at: "2026-09-25T09:17:11.248Z"
cost: 2.0727232000000004
turns: 61
session: "7eb85002-8404-4468-9262-2c4f0cd0f751"
---

I've fixed all six calibration findings in the adapter, but nothing has been run: the TypeScript type check needed approval that wasn't given in this session, and I didn't re-drive the affected flows in the browser. The first calibration run is the first real test of these changes. All the members involved were already listed as bound in `bindings.yaml`, so that file is unchanged. I touched nothing outside `tests/adapters/old/`.

**What I changed, one finding at a time:**

- **R-7.9, the deleted-page message:** it was read from text that stops at the page footer, but the "Page Deleted" message is drawn after the footer, so the reader got nothing. It now uses the existing reader for those after-footer messages (`alertLines`), which also waits for the confirmation dialog to close first.
- **R-1.15, the scoring-weight error, for both Sprint With Us and Team With Us:** it read messages only from whichever step publish happened to leave the form on. It now checks every step of the form, including "6. Scoring" where the weights and their total are. This is the same approach the field-error reader already used.
- **R-1.16, adding a phase:** a "Prototype" phase now maps to the form's "Proof of Concept". The other phase names are matched as before. I made no change for the inception test: the finding says it isn't a binding fault, since "Publish" stays disabled and no step shows a message.
- **R-8.20, R-8.25 and R-8.31, the attachment's file address:** before looking for the stored-file link, the adapter now closes any dialog left open after a submission (Escape first, then a "Close" or "Cancel" button inside it). It then goes to the form's Attachments step, which is "3. Attachments" on a proposal. The existing save-then-wait fallback for a freshly added attachment is kept.
- **R-8.31, removing an attachment already saved on a published opportunity:** removal first walks the steps looking for "Add Attachment". If that isn't found, it chooses "Edit" from the Actions menu (or from the top bar where there is no menu) and goes back to the Attachments step. Adding an attachment already works this way. Only if "Add Attachment" still doesn't appear does it report unbound, and the reason names each of those steps. Removing a just-added attachment is unaffected, because it finds "Add Attachment" on the first try.

**Not fixed, because the findings don't blame the adapter:**
- In R-1.15 and R-8.20, the Team With Us publish never left `/opportunities/team-with-us/create`. The findings describe this for every Team With Us save in the calibration run and don't attribute it to a missing binding, so I didn't touch it. It needs a separate look.
- In R-8.25, the vendor was not refused the draft's attachment before publication. The finding says this is the target's behaviour, not a binding problem.

**Other points:**
- Every route opened in this revision resolves on the target.
- No change was asked of any file outside this adapter's own folder.
- No password or environment value is written into either file.

## Fix turn



tests/adapters/old/bindings.yaml: opportunity-cwu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-cwu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.scope_section is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.terms_section is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-twu-edit.offered_state_changes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-create-swu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-edit-swu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-create-twu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-edit-twu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: content-list.page_count is missing
tests/adapters/old/bindings.yaml: caught-message.follow_link_in_body is missing
tests/adapters/old/bindings.yaml: caught-message.visible_recipients is missing
tests/adapters/old/bindings.yaml: caught-message.copied_recipients is missing
tests/adapters/old/bindings.yaml: caught-message.sender is missing
tests/adapters/old/bindings.yaml: caught-message.reply_to is missing
tests/adapters/old/bindings.yaml: caught-message.subject is missing
tests/adapters/old/bindings.yaml: caught-message.html_body is missing
tests/adapters/old/bindings.yaml: caught-message.plain_text_body is missing
tests/adapters/old/bindings.yaml: caught-message.logo_address is missing
tests/adapters/old/bindings.yaml: caught-message.links_in_body is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_identifiers is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_subjects is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_visible_recipients is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_count is missing
tests/adapters/old/bindings.yaml: organization-acting-for-list.organizations_offered is missing
tests/adapters/old/bindings.yaml: organization-acting-for-list.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invite_with_membership_type is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invitation_created is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invalid_membership_type_error is missing
tests/adapters/old/bindings.yaml: user-list-request.accounts_answered is missing
tests/adapters/old/bindings.yaml: user-list-request.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: user-list-request.refusal_status is missing
tests/adapters/old/bindings.yaml: content-request.read_page_list_by_request is missing
tests/adapters/old/bindings.yaml: content-request.read_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.create_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.change_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.rename_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.remove_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.request_accepted is missing
tests/adapters/old/bindings.yaml: content-request.refusal_status is missing
tests/adapters/old/bindings.yaml: content-request.refusal_shape is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.save_draft_as_entered is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.submit_this_evaluation_alone is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.stored_scores is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.stored_notes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.evaluation_status is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.refused_as_unrecognised is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.refused_at_submission is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.save_draft_as_entered is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.submit_this_evaluation_alone is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.stored_scores is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.stored_notes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.evaluation_status is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.refused_as_unrecognised is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.refused_at_submission is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.submit_panel_with_member_holding_no_role is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.member_without_role_error is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.panel_as_stored is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attach_stored_file is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attachment_accepted is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attachment_refused is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attached_file_identifiers is missing
tests/adapters/old/bindings.yaml: opportunity-cwu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-cwu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.scope_section is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-swu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.terms_section is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.successful_proponent_contact_details is missing
tests/adapters/old/bindings.yaml: opportunity-twu-view.successful_proponent_score is missing
tests/adapters/old/bindings.yaml: opportunity-twu-edit.offered_state_changes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-create-swu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-edit-swu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-create-twu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: evaluation-individual-edit-twu.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: content-list.page_count is missing
tests/adapters/old/bindings.yaml: caught-message.follow_link_in_body is missing
tests/adapters/old/bindings.yaml: caught-message.visible_recipients is missing
tests/adapters/old/bindings.yaml: caught-message.copied_recipients is missing
tests/adapters/old/bindings.yaml: caught-message.sender is missing
tests/adapters/old/bindings.yaml: caught-message.reply_to is missing
tests/adapters/old/bindings.yaml: caught-message.subject is missing
tests/adapters/old/bindings.yaml: caught-message.html_body is missing
tests/adapters/old/bindings.yaml: caught-message.plain_text_body is missing
tests/adapters/old/bindings.yaml: caught-message.logo_address is missing
tests/adapters/old/bindings.yaml: caught-message.links_in_body is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_identifiers is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_subjects is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_visible_recipients is missing
tests/adapters/old/bindings.yaml: caught-message-list.message_count is missing
tests/adapters/old/bindings.yaml: organization-acting-for-list.organizations_offered is missing
tests/adapters/old/bindings.yaml: organization-acting-for-list.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invite_with_membership_type is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invitation_created is missing
tests/adapters/old/bindings.yaml: affiliation-invitation-request.invalid_membership_type_error is missing
tests/adapters/old/bindings.yaml: user-list-request.accounts_answered is missing
tests/adapters/old/bindings.yaml: user-list-request.refused_when_not_permitted is missing
tests/adapters/old/bindings.yaml: user-list-request.refusal_status is missing
tests/adapters/old/bindings.yaml: content-request.read_page_list_by_request is missing
tests/adapters/old/bindings.yaml: content-request.read_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.create_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.change_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.rename_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.remove_page_by_request is missing
tests/adapters/old/bindings.yaml: content-request.request_accepted is missing
tests/adapters/old/bindings.yaml: content-request.refusal_status is missing
tests/adapters/old/bindings.yaml: content-request.refusal_shape is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.save_draft_as_entered is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.submit_this_evaluation_alone is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.stored_scores is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.stored_notes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.evaluation_status is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.refused_as_unrecognised is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-swu.refused_at_submission is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.save_draft_as_entered is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.submit_this_evaluation_alone is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.stored_scores is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.stored_notes is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.evaluation_status is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.refused_as_unrecognised is missing
tests/adapters/old/bindings.yaml: evaluation-individual-request-twu.refused_at_submission is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.submit_panel_with_member_holding_no_role is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.member_without_role_error is missing
tests/adapters/old/bindings.yaml: evaluation-panel-request.panel_as_stored is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attach_stored_file is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attachment_accepted is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attachment_refused is missing
tests/adapters/old/bindings.yaml: file-attach-by-identifier.attached_file_identifiers is missing