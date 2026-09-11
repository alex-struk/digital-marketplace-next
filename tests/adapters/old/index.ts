// Adapter for the "old" target — the existing Digital Marketplace application, used as
// the behavioural oracle.
//
// What this adapter does and does not claim
// -----------------------------------------
// Navigation and sign-in are written from the contract: `spec/contract/surface.yaml`
// gives every page its route, and `tests/generated/personas.ts` gives every persona the
// session route that mints its session on this target. Those two things are knowable
// without looking at a page, so `open()` and `signIn()` are implemented for real.
//
// Every action and every observation is a different matter: binding one means opening
// the page on the running target and finding the control by its role, its label, its
// visible text or the address it leads to. This run could not open the target at all —
// the browser tooling available in this workspace has no usable Chromium (it is pinned
// to a Google Chrome channel that is not installed on the machine), and the session was
// refused both shell and network access to reach the application another way. Nothing
// was observed, so nothing is bound: every action and observation throws the standard
// `unbound: <page>.<member> — <reason>` error, and `bindings.yaml` beside this file
// records the same for each of them. That reports honestly as "not bound" rather than
// as a real behavioural failure, and it leaves no guessed locator behind to be mistaken
// later for something that was checked against the running application.
import type { Page } from "@playwright/test";
import type { Surface } from "../../generated/surface";
import type { persona, Persona } from "../../generated/personas";

const REASON =
  "the running target could not be opened from this workspace (no usable browser was " +
  "available to the session that wrote this adapter), so no control on the page was " +
  "observed to bind this to";

/** One page of the surface, spelled as `spec/contract/surface.yaml` spells it. */
interface PageSpec {
  readonly id: string;
  readonly route: string;
  readonly actions: readonly string[];
  readonly observations: readonly string[];
}

const PAGES: readonly PageSpec[] = [
  {
    id: "home",
    route: "/",
    actions: ["browse_opportunities", "sign_in", "sign_up"],
    observations: [
      "total_awarded_opportunity_count",
      "total_awarded_opportunity_value",
      "readable_when_signed_out",
    ],
  },
  {
    id: "opportunity-dashboard",
    route: "/dashboard",
    actions: ["create_opportunity", "open_opportunity"],
    observations: [
      "my_opportunities_table",
      "opportunity_status",
      "own_opportunities_only",
      "all_opportunities_for_administrator",
      "empty_my_opportunities_message",
    ],
  },
  {
    id: "opportunity-list",
    route: "/opportunities",
    actions: [
      "filter_by_program",
      "filter_by_status",
      "filter_remote_only",
      "search",
      "toggle_watch",
    ],
    observations: [
      "unpublished_group",
      "open_group",
      "closed_group",
      "opportunity_status",
      "proposal_deadline",
    ],
  },
  {
    id: "opportunity-program-select",
    route: "/opportunities/create",
    actions: ["choose_code_with_us", "choose_sprint_with_us", "choose_team_with_us"],
    observations: ["program_card", "max_budget"],
  },
  {
    id: "opportunity-cwu-create",
    route: "/opportunities/code-with-us/create",
    actions: ["save_draft", "submit_for_review", "publish", "add_attachment"],
    observations: ["field_error"],
  },
  {
    id: "opportunity-cwu-view",
    route: "/opportunities/code-with-us/:opportunityId",
    actions: ["toggle_watch", "start_proposal"],
    observations: [
      "status",
      "proposal_deadline",
      "reward",
      "addenda",
      "successful_proponent",
    ],
  },
  {
    id: "opportunity-cwu-edit",
    route: "/opportunities/code-with-us/:opportunityId/edit",
    actions: [
      "edit_details",
      "submit_for_review",
      "publish",
      "cancel_opportunity",
      "delete_opportunity",
      "add_addendum",
      "add_note",
    ],
    observations: [
      "summary_tab",
      "opportunity_tab",
      "addenda_tab",
      "history_tab",
      "proposals_tab",
      "reporting_views",
      "reporting_watchers",
      "reporting_proposals",
    ],
  },
  {
    id: "opportunity-cwu-complete",
    route: "/opportunities/code-with-us/:opportunityId/complete",
    actions: [],
    observations: ["full_report"],
  },
  {
    id: "opportunity-swu-create",
    route: "/opportunities/sprint-with-us/create",
    actions: [
      "save_draft",
      "submit_for_review",
      "publish",
      "add_phase",
      "add_team_question",
      "set_evaluation_panel",
    ],
    observations: ["field_error", "score_weight_error"],
  },
  {
    id: "opportunity-swu-view",
    route: "/opportunities/sprint-with-us/:opportunityId",
    actions: ["toggle_watch", "start_proposal"],
    observations: [
      "status",
      "proposal_deadline",
      "total_max_budget",
      "phases",
      "addenda",
      "successful_proponent",
    ],
  },
  {
    id: "opportunity-swu-edit",
    route: "/opportunities/sprint-with-us/:opportunityId/edit",
    actions: [
      "edit_details",
      "submit_for_review",
      "publish",
      "cancel_opportunity",
      "delete_opportunity",
      "add_addendum",
      "add_note",
      "edit_evaluation_panel",
      "finalize_question_consensuses",
      "start_team_scenario",
    ],
    observations: [
      "summary_tab",
      "opportunity_tab",
      "addenda_tab",
      "history_tab",
      "proposals_tab",
      "team_questions_tab",
      "code_challenge_tab",
      "team_scenario_tab",
      "evaluation_panel_tab",
      "consensus_tab",
    ],
  },
  {
    id: "opportunity-swu-complete",
    route: "/opportunities/sprint-with-us/:opportunityId/complete",
    actions: [],
    observations: ["full_report"],
  },
  {
    id: "opportunity-twu-create",
    route: "/opportunities/team-with-us/create",
    actions: [
      "save_draft",
      "submit_for_review",
      "publish",
      "add_resource",
      "add_resource_question",
      "set_evaluation_panel",
    ],
    observations: ["field_error", "score_weight_error"],
  },
  {
    id: "opportunity-twu-view",
    route: "/opportunities/team-with-us/:opportunityId",
    actions: ["toggle_watch", "start_proposal"],
    observations: [
      "status",
      "proposal_deadline",
      "max_budget",
      "resources",
      "addenda",
      "successful_proponent",
    ],
  },
  {
    id: "opportunity-twu-edit",
    route: "/opportunities/team-with-us/:opportunityId/edit",
    actions: [
      "edit_details",
      "submit_for_review",
      "publish",
      "cancel_opportunity",
      "delete_opportunity",
      "add_addendum",
      "edit_evaluation_panel",
      "finalize_question_consensuses",
    ],
    observations: [
      "summary_tab",
      "opportunity_tab",
      "addenda_tab",
      "history_tab",
      "proposals_tab",
      "resource_questions_tab",
      "challenge_tab",
      "evaluation_panel_tab",
      "consensus_tab",
    ],
  },
  {
    id: "opportunity-twu-complete",
    route: "/opportunities/team-with-us/:opportunityId/complete",
    actions: [],
    observations: ["full_report"],
  },
  {
    id: "proposal-cwu-create",
    route: "/opportunities/code-with-us/:opportunityId/proposals/create",
    actions: [
      "choose_proponent_individual",
      "choose_proponent_organization",
      "add_attachment",
      "save_draft",
      "submit_proposal",
      "accept_program_terms",
      "accept_app_terms",
      "cancel",
    ],
    observations: [
      "field_error",
      "opportunity_summary",
      "terms_modal",
      "submit_disabled_until_terms_accepted",
    ],
  },
  {
    id: "proposal-cwu-edit",
    route: "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit",
    actions: [
      "start_editing",
      "save_changes",
      "save_changes_and_submit",
      "submit_proposal",
      "withdraw_proposal",
      "delete_proposal",
      "add_attachment",
      "remove_attachment",
    ],
    observations: [
      "proposal_tab",
      "status",
      "submitted_at",
      "score",
      "rank",
      "available_actions",
    ],
  },
  {
    id: "proposal-cwu-view",
    route: "/opportunities/code-with-us/:opportunityId/proposals/:proposalId",
    actions: ["enter_score", "award_proposal", "disqualify_proposal"],
    observations: [
      "proposal_tab",
      "history_tab",
      "proponent",
      "score",
      "rank",
      "export_link",
    ],
  },
  {
    id: "proposal-cwu-export-one",
    route: "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export",
    actions: [],
    observations: ["exported_proposal"],
  },
  {
    id: "proposal-cwu-export-all",
    route: "/opportunities/code-with-us/:opportunityId/proposals/export",
    actions: [],
    observations: ["exported_proposal"],
  },
  {
    id: "proposal-swu-create",
    route: "/opportunities/sprint-with-us/:opportunityId/proposals/create",
    actions: [
      "choose_organization",
      "add_phase_team_member",
      "set_scrum_master",
      "set_phase_proposed_cost",
      "answer_team_question",
      "add_reference",
      "add_attachment",
      "save_draft",
      "submit_proposal",
      "accept_program_terms",
      "accept_app_terms",
    ],
    observations: [
      "field_error",
      "capability_gap_error",
      "budget_exceeded_error",
      "unqualified_organization_notice",
      "pending_team_member",
    ],
  },
  {
    id: "proposal-swu-edit",
    route: "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit",
    actions: [
      "start_editing",
      "save_changes",
      "save_changes_and_submit",
      "submit_proposal",
      "withdraw_proposal",
      "delete_proposal",
    ],
    observations: [
      "proposal_tab",
      "scoresheet_tab",
      "status",
      "anonymous_proponent_name",
      "total_score",
      "rank",
    ],
  },
  {
    id: "proposal-swu-view",
    route: "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId",
    actions: [
      "score_code_challenge",
      "screen_in_to_team_scenario",
      "screen_out_from_team_scenario",
      "score_team_scenario",
      "award_proposal",
      "disqualify_proposal",
    ],
    observations: [
      "proposal_tab",
      "team_questions_tab",
      "code_challenge_tab",
      "team_scenario_tab",
      "history_tab",
      "wrong_stage_error",
      "questions_score",
      "challenge_score",
      "scenario_score",
      "price_score",
      "total_score",
    ],
  },
  {
    id: "proposal-swu-export-one",
    route: "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export",
    actions: [],
    observations: ["exported_proposal", "anonymous_proponent_name"],
  },
  {
    id: "proposal-swu-export-all",
    route: "/opportunities/sprint-with-us/:opportunityId/proposals/export",
    actions: [],
    observations: ["exported_proposal"],
  },
  {
    id: "proposal-twu-create",
    route: "/opportunities/team-with-us/:opportunityId/proposals/create",
    actions: [
      "choose_organization",
      "add_team_member_for_resource",
      "set_hourly_rate",
      "answer_resource_question",
      "add_attachment",
      "save_draft",
      "submit_proposal",
      "accept_program_terms",
      "accept_app_terms",
    ],
    observations: [
      "field_error",
      "service_area_error",
      "unqualified_organization_notice",
    ],
  },
  {
    id: "proposal-twu-edit",
    route: "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit",
    actions: [
      "start_editing",
      "save_changes",
      "save_changes_and_submit",
      "submit_proposal",
      "withdraw_proposal",
      "delete_proposal",
    ],
    observations: [
      "proposal_tab",
      "scoresheet_tab",
      "status",
      "anonymous_proponent_name",
      "total_score",
      "rank",
    ],
  },
  {
    id: "proposal-twu-view",
    route: "/opportunities/team-with-us/:opportunityId/proposals/:proposalId",
    actions: [
      "score_resource_questions",
      "screen_in_to_challenge",
      "screen_out_from_challenge",
      "score_challenge",
      "award_proposal",
      "disqualify_proposal",
    ],
    observations: [
      "proposal_tab",
      "resource_questions_tab",
      "challenge_tab",
      "history_tab",
      "wrong_stage_error",
      "questions_score",
      "challenge_score",
      "price_score",
      "total_score",
    ],
  },
  {
    id: "proposal-twu-export-one",
    route: "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export",
    actions: [],
    observations: ["exported_proposal"],
  },
  {
    id: "proposal-twu-export-all",
    route: "/opportunities/team-with-us/:opportunityId/proposals/export",
    actions: [],
    observations: ["exported_proposal"],
  },
  {
    id: "proposal-vendor-dashboard",
    route: "/dashboard",
    actions: ["show_my_proposals", "show_org_proposals"],
    observations: [
      "my_proposals_table",
      "org_proposals_table",
      "proposal_status",
      "empty_my_proposals_message",
      "empty_org_proposals_message",
    ],
  },
  {
    id: "proposal-list-stub",
    route: "/proposals",
    actions: [],
    observations: ["placeholder_text"],
  },
  {
    id: "organization-list",
    route: "/organizations",
    actions: [
      "change_page",
      "open_organization",
      "create_organization",
      "my_organizations",
    ],
    observations: [
      "organization_name",
      "owner_name",
      "swu_qualified_mark",
      "twu_qualified_mark",
      "pagination",
    ],
  },
  {
    id: "organization-create",
    route: "/organizations/create",
    actions: ["create_organization", "cancel", "change_logo"],
    observations: ["field_error", "submit_disabled_until_valid"],
  },
  {
    id: "organization-edit",
    route: "/organizations/:orgId/edit",
    actions: [
      "edit_organization",
      "save_changes",
      "cancel_editing",
      "archive_organization",
      "add_team_members",
      "approve_pending_member",
      "remove_team_member",
      "toggle_member_admin_status",
      "accept_org_admin_terms",
      "change_owner",
      "edit_service_areas",
      "save_service_areas",
      "view_swu_terms",
      "view_twu_terms",
    ],
    observations: [
      "organization_tab",
      "team_tab",
      "swu_qualification_tab",
      "twu_qualification_tab",
      "changelog_tab",
      "swu_qualified_badge",
      "twu_qualified_badge",
      "owner_badge",
      "pending_badge",
      "team_member_row",
      "team_capabilities",
      "swu_requirement_two_members",
      "swu_requirement_all_capabilities",
      "swu_requirement_terms_accepted",
      "twu_requirement_service_area",
      "twu_requirement_terms_accepted",
      "service_area_checkbox",
      "not_qualified_notice",
      "changelog_entry",
      "field_error",
    ],
  },
  {
    id: "organization-swu-terms",
    route: "/organizations/:orgId/sprint-with-us-terms-and-conditions",
    actions: ["accept_terms", "cancel"],
    observations: ["terms_body", "accepted_on_notice"],
  },
  {
    id: "organization-twu-terms",
    route: "/organizations/:orgId/team-with-us-terms-and-conditions",
    actions: ["accept_terms", "cancel"],
    observations: ["terms_body", "accepted_on_notice"],
  },
  {
    id: "organization-user-memberships",
    route: "/users/:userId?tab=organizations",
    actions: [
      "approve_invitation",
      "reject_invitation",
      "leave_organization",
      "create_organization",
      "open_organization",
    ],
    observations: [
      "owned_organizations_table",
      "affiliated_organizations_table",
      "pending_badge",
      "team_member_count",
      "swu_qualified_mark",
      "empty_owned_message",
      "empty_affiliated_message",
    ],
  },
  {
    id: "user-sign-in",
    route: "/sign-in",
    actions: [
      "sign_in_as_vendor",
      "sign_in_as_public_sector_employee",
      "go_to_sign_up",
    ],
    observations: ["vendor_card", "public_sector_card"],
  },
  {
    id: "user-sign-up-choose-account",
    route: "/sign-up",
    actions: ["sign_up_as_vendor", "sign_up_as_public_sector_employee"],
    observations: ["vendor_card", "public_sector_card"],
  },
  {
    id: "user-sign-up-complete",
    route: "/sign-up/complete",
    actions: [
      "change_avatar",
      "accept_app_terms",
      "toggle_new_opportunity_notifications",
      "complete_profile",
    ],
    observations: [
      "idp_username_readonly",
      "name_field",
      "email_field",
      "job_title_field",
      "terms_checkbox",
      "complete_disabled_until_terms_accepted",
      "field_error",
    ],
  },
  {
    id: "user-sign-out",
    route: "/sign-out",
    actions: [],
    observations: ["signed_out_message", "sign_out_failed_message"],
  },
  {
    id: "user-notice",
    route: "/notice/:noticeId",
    actions: ["back_to_home"],
    observations: ["deactivated_own_account_notice", "sign_in_failed_notice"],
  },
  {
    id: "user-list",
    route: "/users",
    actions: [
      "search_by_name",
      "open_export_contact_list",
      "toggle_export_user_type",
      "toggle_export_field",
      "export_contact_list",
      "cancel_export",
      "open_user_profile",
    ],
    observations: [
      "user_row",
      "status_badge",
      "account_type",
      "admin_check",
      "export_modal",
      "export_disabled_until_selection",
    ],
  },
  {
    id: "user-profile",
    route: "/users/:userId",
    actions: [
      "edit_profile",
      "save_changes",
      "cancel_editing",
      "change_avatar",
      "toggle_admin_permission",
      "deactivate_account",
      "reactivate_account",
      "confirm_activation_change",
      "cancel_activation_change",
    ],
    observations: [
      "profile_tab",
      "capabilities_tab",
      "notifications_tab",
      "legal_tab",
      "organizations_tab",
      "status_badge",
      "account_type",
      "permissions_label",
      "admin_checkbox",
      "idp_username_readonly",
      "name_field",
      "email_field",
      "job_title_field",
      "field_error",
      "activation_modal",
      "not_found_page",
    ],
  },
  {
    id: "user-profile-capabilities",
    route: "/users/:userId?tab=capabilities",
    actions: ["toggle_capability", "expand_capability_description"],
    observations: ["capability_row", "capability_checked", "capability_description"],
  },
  {
    id: "user-profile-notifications",
    route: "/users/:userId?tab=notifications",
    actions: [
      "toggle_new_opportunity_notifications",
      "confirm_unsubscribe",
      "cancel_unsubscribe",
    ],
    observations: [
      "new_opportunities_checkbox",
      "notification_email_address",
      "unsubscribe_modal",
    ],
  },
  {
    id: "user-profile-legal",
    route: "/users/:userId?tab=legal",
    actions: ["open_app_terms", "accept_updated_terms", "confirm_accept_updated_terms"],
    observations: [
      "privacy_policy",
      "app_terms_link",
      "accepted_on_notice",
      "terms_updated_warning",
      "program_terms_links",
      "accept_updated_terms_modal",
    ],
  },
  {
    id: "evaluation-panel-dashboard",
    route: "/dashboard",
    actions: ["show_my_opportunities", "show_panel_opportunities", "open_opportunity"],
    observations: [
      "evaluations_tab",
      "panel_opportunities_table",
      "opportunity_status",
      "empty_panel_opportunities_message",
    ],
  },
  {
    id: "evaluation-panel-swu",
    route: "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel",
    actions: [
      "add_panel_member",
      "remove_panel_member",
      "choose_panel_chair",
      "mark_member_as_chair",
      "save_evaluation_panel",
    ],
    observations: [
      "panel_member_row",
      "chair_field",
      "minimum_members_error",
      "duplicate_member_error",
      "non_public_sector_member_error",
      "missing_chair_error",
      "panel_locked_after_consensus",
    ],
  },
  {
    id: "evaluation-panel-twu",
    route: "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel",
    actions: [
      "add_panel_member",
      "remove_panel_member",
      "choose_panel_chair",
      "mark_member_as_chair",
      "save_evaluation_panel",
    ],
    observations: [
      "panel_member_row",
      "chair_field",
      "minimum_members_error",
      "duplicate_member_error",
      "non_public_sector_member_error",
      "missing_chair_error",
      "panel_locked_after_consensus",
    ],
  },
  {
    id: "evaluation-instructions-swu",
    route: "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
    actions: [],
    observations: ["instructions_body", "visible_to_evaluators_only"],
  },
  {
    id: "evaluation-instructions-twu",
    route: "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
    actions: [],
    observations: ["instructions_body", "visible_to_evaluators_only"],
  },
  {
    id: "evaluation-individual-list-swu",
    route: "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation",
    actions: ["open_proponent_evaluation", "submit_scores_for_consensus"],
    observations: [
      "proponent_row",
      "anonymous_proponent_name",
      "evaluation_status",
      "submit_disabled_until_complete",
      "incomplete_evaluation_error",
      "own_evaluations_only",
    ],
  },
  {
    id: "evaluation-individual-list-twu",
    route: "/opportunities/team-with-us/:opportunityId/edit?tab=evaluation",
    actions: ["open_proponent_evaluation", "submit_scores_for_consensus"],
    observations: [
      "proponent_row",
      "anonymous_proponent_name",
      "evaluation_status",
      "submit_disabled_until_complete",
      "incomplete_evaluation_error",
      "own_evaluations_only",
    ],
  },
  {
    id: "evaluation-consensus-list-swu",
    route: "/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus",
    actions: [
      "open_proponent_consensus",
      "submit_final_consensus_scores",
      "confirm_submit_consensus",
      "finalize_consensus_scores",
      "confirm_finalize_consensus",
      "cancel_modal",
    ],
    observations: [
      "proponent_row",
      "consensus_status",
      "submit_confirmation_modal",
      "finalize_confirmation_modal",
      "not_all_consensuses_submitted_error",
      "no_screenable_proponent_error",
      "empty_for_owner_not_on_panel",
    ],
  },
  {
    id: "evaluation-consensus-list-twu",
    route: "/opportunities/team-with-us/:opportunityId/edit?tab=consensus",
    actions: [
      "open_proponent_consensus",
      "submit_final_consensus_scores",
      "confirm_submit_consensus",
      "finalize_consensus_scores",
      "confirm_finalize_consensus",
      "cancel_modal",
    ],
    observations: [
      "proponent_row",
      "consensus_status",
      "submit_confirmation_modal",
      "finalize_confirmation_modal",
      "not_all_consensuses_submitted_error",
      "no_screenable_proponent_error",
      "empty_for_owner_not_on_panel",
    ],
  },
  {
    id: "evaluation-individual-create-swu",
    route:
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_draft",
      "save_and_go_to_next_proponent",
      "save_and_go_to_previous_proponent",
    ],
    observations: [
      "anonymous_proponent_name",
      "question_response",
      "score_out_of_range_error",
      "empty_notes_error",
      "duplicate_evaluation_error",
    ],
  },
  {
    id: "evaluation-individual-edit-swu",
    route:
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_changes",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "evaluation_status",
      "read_only_after_submitted",
      "score_out_of_range_error",
      "empty_notes_error",
    ],
  },
  {
    id: "evaluation-consensus-create-swu",
    route:
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_draft",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "anonymous_proponent_name",
      "panel_member_score",
      "panel_member_notes",
      "chair_only",
      "duplicate_consensus_error",
    ],
  },
  {
    id: "evaluation-consensus-edit-swu",
    route:
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_changes",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "consensus_status",
      "editable_after_submitted",
      "panel_member_score",
      "panel_member_notes",
    ],
  },
  {
    id: "evaluation-individual-create-twu",
    route:
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_draft",
      "save_and_go_to_next_proponent",
      "save_and_go_to_previous_proponent",
    ],
    observations: [
      "anonymous_proponent_name",
      "question_response",
      "score_out_of_range_error",
      "empty_notes_error",
      "duplicate_evaluation_error",
    ],
  },
  {
    id: "evaluation-individual-edit-twu",
    route:
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_changes",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "evaluation_status",
      "read_only_after_submitted",
      "score_out_of_range_error",
      "empty_notes_error",
    ],
  },
  {
    id: "evaluation-consensus-create-twu",
    route:
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_draft",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "anonymous_proponent_name",
      "panel_member_score",
      "panel_member_notes",
      "chair_only",
      "duplicate_consensus_error",
    ],
  },
  {
    id: "evaluation-consensus-edit-twu",
    route:
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
    actions: [
      "enter_question_score",
      "enter_question_notes",
      "save_changes",
      "save_and_go_to_next_proponent",
    ],
    observations: [
      "consensus_status",
      "editable_after_submitted",
      "panel_member_score",
      "panel_member_notes",
    ],
  },
  {
    id: "notification-unsubscribe-landing",
    route: "/users/me?tab=notifications&unsubscribe",
    actions: ["confirm_unsubscribe", "cancel_unsubscribe"],
    observations: [
      "unsubscribe_confirmation",
      "confirmation_names_signed_in_address",
      "resolves_to_signed_in_person",
      "sign_in_required",
    ],
  },
  {
    id: "notification-optin-opportunity-list",
    route: "/opportunities",
    actions: ["toggle_new_opportunity_notifications"],
    observations: [
      "notification_control",
      "notification_control_state",
      "notification_control_hidden_on_narrow_screen",
    ],
  },
  {
    id: "notification-terms-broadcast",
    route: "/content/terms-and-conditions/edit",
    actions: [
      "notify_vendors_of_updated_terms",
      "confirm_notify_vendors",
      "cancel_notify_vendors",
    ],
    observations: [
      "notify_vendors_control",
      "notify_vendors_confirmation",
      "notify_vendors_success",
      "notify_vendors_failure",
    ],
  },
  {
    id: "notification-email-reference",
    route: "/admin/email-notification-reference",
    actions: ["open_reference"],
    observations: [
      "message_group_title",
      "message_subject",
      "message_summary",
      "message_body",
      "refused_for_non_administrator",
    ],
  },
  {
    id: "content-footer",
    route: "/",
    actions: [
      "open_about",
      "open_disclaimer",
      "open_privacy",
      "open_accessibility",
      "open_copyright",
    ],
    observations: [
      "about_link",
      "disclaimer_link",
      "privacy_link",
      "accessibility_link",
      "copyright_link",
      "present_when_signed_out",
    ],
  },
  {
    id: "content-list",
    route: "/content",
    actions: ["open_page_for_editing", "open_public_page", "create_page"],
    observations: [
      "page_title",
      "page_public_address",
      "page_is_fixed",
      "page_created_date",
      "page_updated_date",
      "ordered_by_title",
      "refused_for_non_administrator",
    ],
  },
  {
    id: "content-create",
    route: "/content/create",
    actions: [
      "enter_title",
      "enter_slug",
      "enter_body",
      "upload_body_image",
      "publish_page",
      "confirm_publish",
      "cancel",
    ],
    observations: [
      "field_error",
      "slug_rule_help",
      "resulting_public_address",
      "publish_disabled_until_valid",
      "publish_confirmation",
      "published_success",
      "duplicate_slug_error",
      "refused_for_non_administrator",
    ],
  },
  {
    id: "content-edit",
    route: "/content/:slug/edit",
    actions: [
      "start_editing",
      "edit_title",
      "edit_slug",
      "edit_body",
      "upload_body_image",
      "publish_changes",
      "confirm_publish_changes",
      "cancel_editing",
      "delete_page",
      "confirm_delete_page",
    ],
    observations: [
      "published_date",
      "updated_date",
      "published_by",
      "updated_by",
      "fixed_page_warning",
      "slug_locked_for_fixed_page",
      "delete_withheld_for_fixed_page",
      "field_error",
      "duplicate_slug_error",
      "changes_published_success",
      "deleted_success",
      "refused_for_non_administrator",
    ],
  },
  {
    id: "content-view",
    route: "/content/:slug",
    actions: ["follow_body_link"],
    observations: [
      "page_title",
      "page_body",
      "published_date",
      "updated_date",
      "readable_when_signed_out",
      "not_found_for_unknown_address",
    ],
  },
  {
    id: "file-download",
    route: "/api/files/:fileId?type=blob",
    actions: ["download_file"],
    observations: [
      "file_contents",
      "file_name_on_save",
      "offered_as_download_not_displayed",
      "content_type_from_name",
      "readable_when_signed_out_if_public",
      "refused_when_not_permitted",
      "refused_for_unknown_file",
      "not_found_for_administrator",
    ],
  },
  {
    id: "file-attachment-control",
    route: "/opportunities/:program/:opportunityId/edit?tab=attachments",
    actions: [
      "add_attachment",
      "rename_new_attachment",
      "remove_new_attachment",
      "remove_existing_attachment",
      "download_attachment",
    ],
    observations: [
      "new_attachment_row",
      "existing_attachment_row",
      "existing_attachment_name_read_only",
      "original_extension_restored",
      "file_name_error",
      "remove_control_hidden_when_not_removable",
      "attachment_list_on_public_view",
    ],
  },
  {
    id: "file-image-picker",
    route: "/users/:userId",
    actions: ["choose_image"],
    observations: [
      "current_image",
      "chosen_image_preview",
      "only_jpeg_and_png_offered",
      "rejected_image_error",
      "image_readable_when_signed_out",
    ],
  },
  {
    id: "file-embedded-image",
    route: "/content/:slug/edit",
    actions: ["upload_body_image"],
    observations: [
      "image_inserted_into_text",
      "only_jpeg_and_png_offered",
      "uploading_indicator",
      "image_rendered_in_published_text",
      "upload_failure_leaves_text_unchanged",
    ],
  },
];

/** `opportunity-cwu-create` and `submit_for_review` become `opportunityCwuCreate` and
 *  `submitForReview` — the spelling the generated surface uses for the same thing. */
function camel(name: string): string {
  return name.replace(/[-_]([a-z0-9])/g, (_whole, character: string) =>
    character.toUpperCase(),
  );
}

export default function create(
  page: Page,
  ctx: { baseURL: string; persona: typeof persona },
): Surface {
  const origin = (ctx.baseURL ?? "").replace(/\/+$/, "");
  if (!origin) {
    throw new Error(
      'the "old" adapter was given no base URL; run with SDLC_TARGET_URL set to the running application',
    );
  }

  // A page's route with its `:name` placeholders filled from `open()`'s params. Query
  // strings in a route (".../edit?tab=consensus") name a tab and are carried through
  // untouched.
  function address(route: string, params?: Record<string, string>): string {
    const filled = route.replace(
      /:([A-Za-z][A-Za-z0-9]*)/g,
      (_whole, name: string) => {
        const value = params?.[name];
        if (value === undefined) {
          throw new Error(
            `open() of the route ${route} needs a "${name}" parameter and was given none`,
          );
        }
        return encodeURIComponent(value);
      },
    );
    return origin + filled;
  }

  function build(spec: PageSpec): Record<string, unknown> {
    const surfacePage: Record<string, unknown> = {
      open: async (params?: Record<string, string>): Promise<void> => {
        await page.goto(address(spec.route, params));
      },
    };
    for (const name of spec.actions) {
      surfacePage[camel(name)] = async (_input?: unknown): Promise<void> => {
        throw new Error(`unbound: ${spec.id}.${name} — ${REASON}`);
      };
    }
    for (const name of spec.observations) {
      surfacePage[camel(name)] = async (): Promise<string> => {
        throw new Error(`unbound: ${spec.id}.${name} — ${REASON}`);
      };
    }
    return surfacePage;
  }

  // This target mints a session by visiting a route that hands the browser one straight
  // away, so there is no identity provider form in the way. A persona whose entry says
  // the route is unavailable is reported unbound in the same shape an action is, so a
  // criterion needing it reads as unbound rather than as a behaviour that failed.
  async function signIn(who: Persona): Promise<void> {
    const entry = (who as { signIn: unknown }).signIn;
    if (entry === null || entry === undefined) {
      // The anonymous visitor holds no session at all: make sure none is left over.
      await page.context().clearCookies();
      await page.goto(origin + "/");
      return;
    }
    const viaRoute = (entry as Record<string, unknown>)["session-route"] as
      | { route?: string; unavailable?: string }
      | undefined;
    if (!viaRoute) {
      throw new Error(
        `unbound: signIn.${who.id} — this target signs in through a session route and this persona carries none`,
      );
    }
    if (viaRoute.unavailable !== undefined) {
      throw new Error(`unbound: signIn.${who.id} — ${viaRoute.unavailable}`);
    }
    if (!viaRoute.route) {
      throw new Error(
        `unbound: signIn.${who.id} — this persona's session route is empty`,
      );
    }
    await page.context().clearCookies();
    await page.goto(origin + viaRoute.route);
  }

  async function signOut(): Promise<void> {
    await page.goto(origin + "/sign-out");
    await page.context().clearCookies();
  }

  const surface: Record<string, unknown> = { signIn, signOut };
  for (const spec of PAGES) surface[camel(spec.id)] = build(spec);
  return surface as unknown as Surface;
}
