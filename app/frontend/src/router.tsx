import {
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { safeReturnAddress } from "@rules/users";
import { RootLayout } from "./app/root-layout";
import { NotFound } from "./app/not-found";
import { HomeScreen } from "./screens/home";
import { ContentViewScreen } from "./screens/content-view";
import { LearnMoreScreen, isProgramSlug } from "./screens/learn-more";
import { SignInScreen, SignUpScreen, StartSignInScreen } from "./screens/sign-in";
import { AuthCallbackScreen } from "./screens/auth-callback";
import { SignUpCompleteScreen } from "./screens/sign-up-complete";
import { SignOutScreen } from "./screens/sign-out";
import { NoticeScreen } from "./screens/notice";
import { DashboardScreen } from "./screens/dashboard";

/**
 * The addresses in `spec/contract/surface.yaml`, and nothing else. Every other address is the
 * not-found screen.
 */
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

/** A text search parameter, or nothing. */
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Where to come back to after signing in, as far as it is somewhere inside the service. */
function returnSearch(search: Record<string, unknown>): { redirectOnSuccess?: string } {
  const returnTo = safeReturnAddress(text(search.redirectOnSuccess));
  return returnTo ? { redirectOnSuccess: returnTo } : {};
}

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
  validateSearch: returnSearch,
  component: function SignInRoute() {
    const { redirectOnSuccess } = signInRoute.useSearch();
    return <SignInScreen returnTo={redirectOnSuccess ?? null} />;
  },
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  validateSearch: returnSearch,
  component: function SignUpRoute() {
    const { redirectOnSuccess } = signUpRoute.useSearch();
    return <SignUpScreen returnTo={redirectOnSuccess ?? null} />;
  },
});

const signUpCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up/complete",
  validateSearch: returnSearch,
  component: function SignUpCompleteRoute() {
    const { redirectOnSuccess } = signUpCompleteRoute.useSearch();
    return <SignUpCompleteScreen returnTo={redirectOnSuccess ?? null} />;
  },
});

const startSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/sign-in",
  validateSearch: (search: Record<string, unknown>) => ({
    ...returnSearch(search),
    ...(text(search.provider) ? { provider: text(search.provider) } : {}),
  }),
  component: function StartSignInRoute() {
    const { provider, redirectOnSuccess } = startSignInRoute.useSearch();
    return <StartSignInScreen provider={provider ?? null} returnTo={redirectOnSuccess ?? null} />;
  },
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: function CallbackRoute() {
    // Read as the identity provider wrote it, not as the router would parse it.
    const query = useRouterState({ select: (state) => state.location.searchStr });
    return <AuthCallbackScreen query={query} />;
  },
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

export const routeTree = rootRoute.addChildren([
  homeRoute,
  learnMoreRoute,
  contentViewRoute,
  signInRoute,
  signUpRoute,
  signUpCompleteRoute,
  startSignInRoute,
  callbackRoute,
  signOutRoute,
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
