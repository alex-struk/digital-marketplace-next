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
import { UserListScreen } from "./screens/user-list";
import { UserProfileScreen } from "./screens/user-profile";
import { OpportunityProgramSelectScreen } from "./screens/opportunity-program-select";
import { OpportunityCwuCreateScreen } from "./screens/opportunity-cwu-create";
import { OpportunityCwuViewScreen } from "./screens/opportunity-cwu-view";
import { OpportunityCwuEditScreen } from "./screens/opportunity-cwu-edit";

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
  dashboardRoute,
  userListRoute,
  userProfileRoute,
  opportunityProgramSelectRoute,
  opportunityCwuCreateRoute,
  opportunityCwuViewRoute,
  opportunityCwuEditRoute,
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
