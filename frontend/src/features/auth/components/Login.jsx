import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import { useForm } from "react-hook-form";
import { UseLogin } from "../hook/UseLogin";
import { useNavigate } from "react-router-dom";

const Login = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const { mutate, isPending, isSuccess } = UseLogin();
  const onSubmit = (data) => {
    mutate({ name: data.name, email: data.email, password: data.password });
  };

    useEffect(() => {
    if (isSuccess) {
      navigate("/home");
    }
  }, [isSuccess, navigate]);

  return (
    <div className="w-full max-w-lg p-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label>Email</label>
        <Input
          {...register("email", { required: true })}
          name="email"
          required
          className="bg-white py-6 rounded-none"
          type="email"
          placeholder="email"
        />
        <PasswordInput
          {...register("password", { required: true })}
          name="password"
          required
        />
        <Button
          disabled={isPending}
          type="submit"
          className="w-full py-6 rounded-none cursor-pointer"
        >
          {isPending ? "Signing In..." : "Sign In"}
        </Button>
        <div className="flex items-center justify-center md:justify-end mb-2">
          <button type="button" className="cursor-pointer underline">
            Forgot password?
          </button>
        </div>
      </form>
      <div className="flex gap-2 items-center justify-center p-2">
        New to WearHub?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer underline"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Login;
