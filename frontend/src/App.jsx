import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import UseRefresh from "./features/auth/hook/UseRefresh";

const App = () => {

  const { mutate, isPending } = UseRefresh();

  useEffect(() => {
    mutate();
  }, [mutate]);
  console.log("first");

  if (isPending) {
    <h2>Fethcing user....</h2>;
  }

  return <RouterProvider router={router} />;
};

export default App;
