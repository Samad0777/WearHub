import { useState } from "react";
import Login from "../components/Login";
import Register from "../components/Register";

const Auth = () => {
  const [mode, setMode] = useState("register");

  const switchMode = (nextMode) => {
    setMode(nextMode);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-auth-bg px-4">
      <h1 className="text-3xl font-bold">WearHub</h1>
      <p className="mt-2 text-muted-foreground">
        {mode === "login" ? "Sign in to your account" : "Create a new account"}
      </p>
      <div className="mt-6 mb-4 flex w-full max-w-md border-2">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`w-1/2 cursor-pointer border-r-2 border-black py-2 ${mode === "login" ? "bg-black text-white" : "text-black"}`}
        >
          SIGN IN
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`w-1/2 cursor-pointer py-2 ${mode === "register" ? "bg-black text-white" : "text-black"}`}
        >
          REGISTER
        </button>
      </div>
      {mode === "login" ? (
        <Login onSwitch={() => switchMode("register")} />
      ) : (
        <Register onSwitch={() => switchMode("login")} />
      )}
    </main>
  );
};

export default Auth;
