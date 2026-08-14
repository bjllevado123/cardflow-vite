import { Navigate, Outlet, createRootRoute, createRoute, createRouter, useRouterState } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { UserDatabaseProvider } from "@/lib/user-db";
import { Shell } from "@/components/shell";
import { DashboardPage } from "@/pages/dashboard";
import { CardsPage } from "@/pages/cards";
import { CardDetailPage } from "@/pages/card-detail";
import { TransactionsPage } from "@/pages/transactions";
import { PeriodsPage } from "@/pages/periods";
import { SettingsPage } from "@/pages/settings";
import { AuthCallbackPage } from "@/pages/auth-callback";
import { LoginPage } from "@/pages/login";

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname === "/auth/callback";
}

function AuthGate() {
  const { session, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const publicRoute = isPublicPath(pathname);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="text-sm font-medium text-on-surface-variant">Loading CardFlow…</p>
      </div>
    );
  }

  if (!session && !publicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (session && pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  if (publicRoute) {
    return <Outlet />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <UserDatabaseProvider userId={session.user.id} email={session.user.email}>
      <Shell />
    </UserDatabaseProvider>
  );
}

function Root() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: () => <p className="p-8">Page not found.</p>,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const cardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cards",
  component: CardsPage,
});

const cardDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cards/$id",
  component: CardDetailPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
    card: typeof search.card === "string" ? search.card : undefined,
    period: typeof search.period === "string" ? search.period : undefined,
  }),
});

const periodsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/periods",
  component: PeriodsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authRoute,
  indexRoute,
  cardsRoute,
  cardDetailRoute,
  transactionsRoute,
  periodsRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
