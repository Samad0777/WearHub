import { createBrowserRouter } from "react-router";
import Auth from "../features/auth/pages/Auth";
import EmailVerify from "../features/auth/pages/EmailVerify";
import EmailResend from "@/features/auth/pages/EmailResend";
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import Categories from "../pages/Categories";
import UserLayout from "../components/layouts/UserLayout/UserLayout";
import Dashboard from "@/features/admin/pages/Dashboard";
import AdminProtectedRoute from "@/guards/AdminProtectedRoute";
import AdminLayout from "@/components/layouts/adminLayout/AdminLayout";
import Products from "@/features/admin/pages/Products";
import Orders from "@/pages/Orders";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";

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
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        path: "dashboard",
        element: (
          <AdminProtectedRoute>
            <Dashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "products",
        element: (
          <AdminProtectedRoute>
            <Products />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <AdminProtectedRoute>
            <Orders />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "categories",
        element: (
          <AdminProtectedRoute>
            <Categories />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminProtectedRoute>
            <Users />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <AdminProtectedRoute>
            <Settings />
          </AdminProtectedRoute>
        ),
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
