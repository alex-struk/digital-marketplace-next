import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "./app/root-layout";
import { NotFound } from "./app/not-found";
import { HomeScreen } from "./screens/home";
import { ContentViewScreen } from "./screens/content-view";
import { LearnMoreScreen, isProgramSlug } from "./screens/learn-more";
import { SignInScreen, SignUpScreen } from "./screens/sign-in";
import { AuthCallbackScreen, AuthSignInScreen } from "./screens/auth";
import { SignUpCompleteScreen } from "./screens/sign-up-complete";
import { SignOutScreen } from "./screens/sign-out";
import { NoticeScreen } from "./screens/notice";
import { DashboardScreen } from "./screens/dashboard";

/**
 * The addresses in `spec/contract/surface.yaml`, and nothing else. Every other address is the
 * not-found screen. `/auth/sign-in` and `/auth/callback` are screens of this app, where sign-in
 * with the identity provider begins and ends (decision record 0004).
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

const authSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/sign-in",
  component: AuthSignInScreen,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackScreen,
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

export const routeTree = rootRoute.addChildren([
  homeRoute,
  learnMoreRoute,
  contentViewRoute,
  signInRoute,
  signUpRoute,
  signUpCompleteRoute,
  signOutRoute,
  authSignInRoute,
  authCallbackRoute,
  noticeRoute,
  dashboardRoute,
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
