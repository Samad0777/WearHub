import { createBrowserRouter } from "react-router";
import Auth from "../features/auth/pages/Auth";

export const router = createBrowserRouter([
  {
    path:"/auth",
    element:<Auth/>
  },
]);
