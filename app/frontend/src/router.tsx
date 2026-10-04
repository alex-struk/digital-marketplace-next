import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "./app/root-layout";
import { NotFound } from "./app/not-found";
import { HomeScreen } from "./screens/home";
import { ContentViewScreen } from "./screens/content-view";
import { ContentListScreen } from "./screens/content-list";
import { ContentCreateScreen } from "./screens/content-create";
import { ContentEditScreen } from "./screens/content-edit";
import { LearnMoreScreen, isProgramSlug } from "./screens/learn-more";
import { SignInScreen, SignUpScreen } from "./screens/sign-in";
import { SignUpCompleteScreen } from "./screens/sign-up-complete";
import { SignOutScreen } from "./screens/sign-out";
import { NoticeScreen } from "./screens/notice";
import { DashboardScreen } from "./screens/dashboard";
import { ServiceStatusScreen } from "./screens/service-status";
import { UserListScreen } from "./screens/user-list";
import { UserProfileScreen } from "./screens/user-profile";
import { OpportunityListScreen } from "./screens/opportunity-list";
import { OpportunityProgramSelectScreen } from "./screens/opportunity-program-select";
import { OpportunityCwuCreateScreen } from "./screens/opportunity-cwu-create";
import { OpportunityCwuViewScreen } from "./screens/opportunity-cwu-view";
import { OpportunityCwuEditScreen } from "./screens/opportunity-cwu-edit";
import { OpportunityOtherCreateScreen } from "./screens/opportunity-other-create";
import { ProposalCwuCreateScreen } from "./screens/proposal-cwu-create";
import { ProposalCwuEditScreen } from "./screens/proposal-cwu-edit";
import { ProposalCwuViewScreen } from "./screens/proposal-cwu-view";
import { OpportunityOtherManageScreen } from "./screens/opportunity-other-manage";
import { ProposalTeamCreateScreen } from "./screens/proposal-team-create";
import { ProposalTeamEditScreen } from "./screens/proposal-team-edit";
import { ProposalTeamViewScreen } from "./screens/proposal-team-view";
import { OpportunityOtherViewScreen } from "./screens/opportunity-other-view";
import { OrganizationListScreen } from "./screens/organization-list";
import { OrganizationCreateScreen } from "./screens/organization-create";
import { OrganizationEditScreen } from "./screens/organization-edit";
import { OrganizationTermsScreen } from "./screens/organization-terms";
import { EvaluationIndividualScreen } from "./screens/evaluation-individual-form";
import { ConsensusScreen } from "./screens/evaluation-consensus-form";

/**
 * The addresses in `spec/contract/surface.yaml`, and nothing else. Every other address is the
 * not-found screen. `/auth/sign-in` and `/auth/callback` are not screens: the service answers
 * them, and sign-in begins and ends there (decision record 0015).
 */
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});

const learnMoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/learn-more/$program",
  component: function LearnMoreRoute() {
    const { program } = learnMoreRoute.useParams();
    if (!isProgramSlug(program)) return <NotFound />;
    return <LearnMoreScreen program={program} />;
  },
});

const contentViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content/$slug",
  component: function ContentViewRoute() {
    const { slug } = contentViewRoute.useParams();
    return <ContentViewScreen address={slug} />;
  },
});

// The content area, an administrator's alone (R-7.5, R-7.6). "/content/create" is a fixed
// address, so it is matched before any page's own address is.
const contentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content",
  component: ContentListScreen,
});

const contentCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content/create",
  component: ContentCreateScreen,
});

const contentEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content/$slug/edit",
  component: function ContentEditRoute() {
    const { slug } = contentEditRoute.useParams();
    return <ContentEditScreen slug={slug} />;
  },
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInScreen,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  component: SignUpScreen,
});

const signUpCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up/complete",
  component: SignUpCompleteScreen,
});

const signOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-out",
  component: SignOutScreen,
});

const noticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notice/$noticeId",
  component: function NoticeRoute() {
    const { noticeId } = noticeRoute.useParams();
    return <NoticeScreen noticeId={noticeId} />;
  },
});

// scheduled-transition-trigger: a browser's page request for /status (decision record 0060).
const serviceStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/status",
  component: ServiceStatusScreen,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardScreen,
});

const userListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UserListScreen,
});

// Opportunities. The fixed addresses — choosing a program, creating in one — are matched before
// an opportunity's own address is.
const opportunityListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities",
  component: OpportunityListScreen,
});

const opportunityProgramSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/create",
  component: OpportunityProgramSelectScreen,
});

const opportunityCwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/create",
  component: OpportunityCwuCreateScreen,
});

const opportunityCwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/$opportunityId",
  component: function OpportunityCwuViewRoute() {
    const { opportunityId } = opportunityCwuViewRoute.useParams();
    return <OpportunityCwuViewScreen key={opportunityId} opportunityId={opportunityId} />;
  },
});

const opportunityCwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/$opportunityId/edit",
  component: function OpportunityCwuEditRoute() {
    const { opportunityId } = opportunityCwuEditRoute.useParams();
    return <OpportunityCwuEditScreen key={opportunityId} opportunityId={opportunityId} />;
  },
});

// A Code With Us proposal: started from its opportunity, and managed by the vendor who wrote it or
// who owns or administers its organization.
const proposalCwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/$opportunityId/proposals/create",
  component: function ProposalCwuCreateRoute() {
    const { opportunityId } = proposalCwuCreateRoute.useParams();
    return <ProposalCwuCreateScreen key={opportunityId} opportunityId={opportunityId} />;
  },
});

const proposalCwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/$opportunityId/proposals/$proposalId",
  component: function ProposalCwuViewRoute() {
    const { opportunityId, proposalId } = proposalCwuViewRoute.useParams();
    return <ProposalCwuViewScreen key={proposalId} opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

const proposalCwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/code-with-us/$opportunityId/proposals/$proposalId/edit",
  component: function ProposalCwuEditRoute() {
    const { opportunityId, proposalId } = proposalCwuEditRoute.useParams();
    return <ProposalCwuEditScreen key={proposalId} opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

// Sprint With Us and Team With Us: created, read by anyone once published, and managed by their
// author and administrators (decision record 0045).
const opportunitySwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/create",
  component: function OpportunitySwuCreateRoute() {
    return <OpportunityOtherCreateScreen program="sprint-with-us" />;
  },
});

const opportunityTwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/create",
  component: function OpportunityTwuCreateRoute() {
    return <OpportunityOtherCreateScreen program="team-with-us" />;
  },
});

const opportunitySwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId",
  component: function OpportunitySwuViewRoute() {
    const { opportunityId } = opportunitySwuViewRoute.useParams();
    return <OpportunityOtherViewScreen key={opportunityId} program="sprint-with-us" opportunityId={opportunityId} />;
  },
});

const opportunityTwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId",
  component: function OpportunityTwuViewRoute() {
    const { opportunityId } = opportunityTwuViewRoute.useParams();
    return <OpportunityOtherViewScreen key={opportunityId} program="team-with-us" opportunityId={opportunityId} />;
  },
});

const opportunitySwuManageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/edit",
  component: function OpportunitySwuManageRoute() {
    const { opportunityId } = opportunitySwuManageRoute.useParams();
    return <OpportunityOtherManageScreen key={opportunityId} program="sprint-with-us" opportunityId={opportunityId} />;
  },
});

const opportunityTwuManageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/edit",
  component: function OpportunityTwuManageRoute() {
    const { opportunityId } = opportunityTwuManageRoute.useParams();
    return <OpportunityOtherManageScreen key={opportunityId} program="team-with-us" opportunityId={opportunityId} />;
  },
});

// A Sprint With Us or Team With Us proposal: started from its opportunity, and managed by the vendor
// who wrote it or who owns or administers its organization (decision record 0058).
const proposalSwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/create",
  component: function ProposalSwuCreateRoute() {
    const { opportunityId } = proposalSwuCreateRoute.useParams();
    return <ProposalTeamCreateScreen key={opportunityId} program="sprint-with-us" opportunityId={opportunityId} />;
  },
});

const proposalTwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/create",
  component: function ProposalTwuCreateRoute() {
    const { opportunityId } = proposalTwuCreateRoute.useParams();
    return <ProposalTeamCreateScreen key={opportunityId} program="team-with-us" opportunityId={opportunityId} />;
  },
});

// Read-only, to whoever the service lets read it: its vendors, and once the opportunity has closed
// its author and administrators (R-2.25).
const proposalSwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId",
  component: function ProposalSwuViewRoute() {
    const { opportunityId, proposalId } = proposalSwuViewRoute.useParams();
    return <ProposalTeamViewScreen key={proposalId} program="sprint-with-us" opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

const proposalTwuViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId",
  component: function ProposalTwuViewRoute() {
    const { opportunityId, proposalId } = proposalTwuViewRoute.useParams();
    return <ProposalTeamViewScreen key={proposalId} program="team-with-us" opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

const proposalSwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/edit",
  component: function ProposalSwuEditRoute() {
    const { opportunityId, proposalId } = proposalSwuEditRoute.useParams();
    return <ProposalTeamEditScreen key={proposalId} program="sprint-with-us" opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

const proposalTwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/edit",
  component: function ProposalTwuEditRoute() {
    const { opportunityId, proposalId } = proposalTwuEditRoute.useParams();
    return <ProposalTeamEditScreen key={proposalId} program="team-with-us" opportunityId={opportunityId} proposalId={proposalId} />;
  },
});

// One proponent's individual evaluation by a panel evaluator, reached from the Evaluation tab
// (decision record 0062): started at ".../evaluations/create", and the evaluator's own at
// ".../evaluations/<their account>/edit".
const evaluationSwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/team-questions/evaluations/create",
  component: function EvaluationSwuCreateRoute() {
    const { opportunityId, proposalId } = evaluationSwuCreateRoute.useParams();
    return <EvaluationIndividualScreen key={proposalId} program="sprint-with-us" opportunityId={opportunityId} proposalId={proposalId} evaluatorId={null} />;
  },
});

const evaluationSwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/team-questions/evaluations/$userId/edit",
  component: function EvaluationSwuEditRoute() {
    const { opportunityId, proposalId, userId } = evaluationSwuEditRoute.useParams();
    return (
      <EvaluationIndividualScreen
        key={`${proposalId}/${userId}`}
        program="sprint-with-us"
        opportunityId={opportunityId}
        proposalId={proposalId}
        evaluatorId={userId}
      />
    );
  },
});

const evaluationTwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/resource-questions/evaluations/create",
  component: function EvaluationTwuCreateRoute() {
    const { opportunityId, proposalId } = evaluationTwuCreateRoute.useParams();
    return <EvaluationIndividualScreen key={proposalId} program="team-with-us" opportunityId={opportunityId} proposalId={proposalId} evaluatorId={null} />;
  },
});

const evaluationTwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/resource-questions/evaluations/$userId/edit",
  component: function EvaluationTwuEditRoute() {
    const { opportunityId, proposalId, userId } = evaluationTwuEditRoute.useParams();
    return (
      <EvaluationIndividualScreen
        key={`${proposalId}/${userId}`}
        program="team-with-us"
        opportunityId={opportunityId}
        proposalId={proposalId}
        evaluatorId={userId}
      />
    );
  },
});

// The chair's agreed scores for one proponent, reached from the Consensus tab (decision record
// 0063): started at ".../consensus/create", and the chair's at ".../consensus/<the chair>/edit".
const consensusSwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/team-questions/consensus/create",
  component: function ConsensusSwuCreateRoute() {
    const { opportunityId, proposalId } = consensusSwuCreateRoute.useParams();
    return <ConsensusScreen key={proposalId} program="sprint-with-us" opportunityId={opportunityId} proposalId={proposalId} chairId={null} />;
  },
});

const consensusSwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/team-questions/consensus/$userId/edit",
  component: function ConsensusSwuEditRoute() {
    const { opportunityId, proposalId, userId } = consensusSwuEditRoute.useParams();
    return <ConsensusScreen key={`${proposalId}/${userId}`} program="sprint-with-us" opportunityId={opportunityId} proposalId={proposalId} chairId={userId} />;
  },
});

const consensusTwuCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/resource-questions/consensus/create",
  component: function ConsensusTwuCreateRoute() {
    const { opportunityId, proposalId } = consensusTwuCreateRoute.useParams();
    return <ConsensusScreen key={proposalId} program="team-with-us" opportunityId={opportunityId} proposalId={proposalId} chairId={null} />;
  },
});

const consensusTwuEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/resource-questions/consensus/$userId/edit",
  component: function ConsensusTwuEditRoute() {
    const { opportunityId, proposalId, userId } = consensusTwuEditRoute.useParams();
    return <ConsensusScreen key={`${proposalId}/${userId}`} program="team-with-us" opportunityId={opportunityId} proposalId={proposalId} chairId={userId} />;
  },
});

// Organizations. "/organizations/create" is a fixed address, matched before an organization's own.
const organizationListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations",
  component: OrganizationListScreen,
});

const organizationCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations/create",
  component: OrganizationCreateScreen,
});

const organizationEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations/$orgId/edit",
  component: function OrganizationEditRoute() {
    const { orgId } = organizationEditRoute.useParams();
    return <OrganizationEditScreen key={orgId} orgId={orgId} />;
  },
});

const organizationSwuTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations/$orgId/sprint-with-us-terms-and-conditions",
  component: function OrganizationSwuTermsRoute() {
    const { orgId } = organizationSwuTermsRoute.useParams();
    return <OrganizationTermsScreen key={orgId} program="sprint-with-us" orgId={orgId} />;
  },
});

const organizationTwuTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations/$orgId/team-with-us-terms-and-conditions",
  component: function OrganizationTwuTermsRoute() {
    const { orgId } = organizationTwuTermsRoute.useParams();
    return <OrganizationTermsScreen key={orgId} program="team-with-us" orgId={orgId} />;
  },
});

// "me" and an identifier share one route: the screen reads "me" as whoever is signed in.
const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId",
  component: function UserProfileRoute() {
    const { userId } = userProfileRoute.useParams();
    return <UserProfileScreen userId={userId} />;
  },
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  learnMoreRoute,
  contentViewRoute,
  contentListRoute,
  contentCreateRoute,
  contentEditRoute,
  signInRoute,
  signUpRoute,
  signUpCompleteRoute,
  signOutRoute,
  noticeRoute,
  serviceStatusRoute,
  dashboardRoute,
  userListRoute,
  userProfileRoute,
  opportunityListRoute,
  opportunityProgramSelectRoute,
  opportunityCwuCreateRoute,
  opportunityCwuViewRoute,
  opportunityCwuEditRoute,
  proposalCwuCreateRoute,
  proposalCwuViewRoute,
  proposalCwuEditRoute,
  opportunitySwuCreateRoute,
  opportunityTwuCreateRoute,
  opportunitySwuViewRoute,
  opportunityTwuViewRoute,
  opportunitySwuManageRoute,
  opportunityTwuManageRoute,
  proposalSwuCreateRoute,
  proposalTwuCreateRoute,
  proposalSwuViewRoute,
  proposalTwuViewRoute,
  proposalSwuEditRoute,
  proposalTwuEditRoute,
  evaluationSwuCreateRoute,
  evaluationSwuEditRoute,
  evaluationTwuCreateRoute,
  evaluationTwuEditRoute,
  consensusSwuCreateRoute,
  consensusSwuEditRoute,
  consensusTwuCreateRoute,
  consensusTwuEditRoute,
  organizationListRoute,
  organizationCreateRoute,
  organizationEditRoute,
  organizationSwuTermsRoute,
  organizationTwuTermsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
