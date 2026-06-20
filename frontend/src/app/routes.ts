import { createBrowserRouter, redirect } from "react-router";

import AuthLayout           from "./layouts/AuthLayout";
import AppLayout            from "./layouts/AppLayout";

import LoginPage            from "./pages/LoginPage";
import SignUpPage           from "./pages/SignUpPage";
import ForgotPasswordPage   from "./pages/ForgotPasswordPage";

import HomePage             from "./pages/HomePage";
import SavedPage            from "./pages/SavedPage";
import ExplorePage          from "./pages/ExplorePage";
import RouteDetailPage      from "./pages/RouteDetailPage";
import ProfilePage          from "./pages/ProfilePage";
import SocialPage           from "./pages/SocialPage";
import UserProfilePage      from "./pages/UserProfilePage";
import NotificationsPage    from "./pages/NotificationsPage";
import SettingsPage         from "./pages/SettingsPage";
import AboutPage            from "./pages/AboutPage";

export const router = createBrowserRouter([
  // ── Auth (no sidebar) ───────────────────────────────────────────────────────
  {
    Component: AuthLayout,
    children: [
      { index: true,               Component: LoginPage          },
      { path: "signup",            Component: SignUpPage         },
      { path: "forgot-password",   Component: ForgotPasswordPage },
    ],
  },
  // ── App (with sidebar) ──────────────────────────────────────────────────────
  {
    Component: AppLayout,
    children: [
      { path: "home",              Component: HomePage           },
      { path: "saved",             Component: SavedPage          },
      { path: "explore",           Component: ExplorePage        },
      { path: "route/:id",         Component: RouteDetailPage    },
      { path: "profile",           Component: ProfilePage        },
      { path: "social",            Component: SocialPage         },
      { path: "social/:userId",    Component: UserProfilePage    },
      { path: "notifications",     Component: NotificationsPage  },
      { path: "settings",          Component: SettingsPage       },
      { path: "about",             Component: AboutPage          },
    ],
  },
  // ── Fallback ────────────────────────────────────────────────────────────────
  { path: "*", loader: () => redirect("/") },
]);
