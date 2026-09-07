import { createBrowserRouter } from "react-router";
import Auth from "../features/auth/pages/Auth";
import EmailVerify from "../features/auth/pages/EmailVerify";
import EmailResend from "@/features/auth/pages/EmailResend";
import Home from "../pages/Home";

export const router = createBrowserRouter([
  {
    path:"*",
    element:<Auth/>
  },
  {
    path:"/auth",
    element:<Auth/>
  },
  {
    path:"/email-resend",
    element:<EmailResend/>
  },
  {
    path:"/verify-email",
    element:<EmailVerify/>
  },
  {
    path:"/home",
    element:<Home/>
  },
]);
