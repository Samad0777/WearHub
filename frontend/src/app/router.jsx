import { createBrowserRouter } from "react-router";
import Auth from "../features/auth/pages/Auth";
import EmailVerify from "../features/auth/pages/EmailVerify";
import EmailResend from "@/features/auth/pages/EmailResend";
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import Categories from "../pages/Categories";
import UserLayout from "../components/layouts/UserLayout/UserLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UserLayout />,
    children: [
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/shop",
        element: <Shop />,
      },
      {
        path: "/categories",
        element: <Categories />,
      },
    ],
  },

  {
    path: "*",
    element: <Auth />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/email-resend",
    element: <EmailResend />,
  },
  {
    path: "/verify-email",
    element: <EmailVerify />,
  },
]);
