import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import { useForm } from "react-hook-form";
import { UseLogin } from "../hook/UseLogin";
import { useNavigate } from "react-router-dom";

const Login = ({ onSwitch }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { mutate, isPending, isSuccess, isError, error } = UseLogin();
  const onSubmit = (data) => {
    mutate({ name: data.name, email: data.email, password: data.password });
  };

  useEffect(() => {
    if (isSuccess) {
      navigate("/home");
      reset();
    }
  }, [isSuccess, navigate, reset]);

  return (
    <div className="w-full max-w-lg p-2">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {isError && (
          <p className="text-red-500 text-center">
            {error.response?.data?.message || "Something went wrong"}
          </p>
        )}
        <label>Email</label>
        <Input
          {...register("email", { required: "email is required" })}
          name="email"
          required
          className="bg-white py-6 rounded-none"
          type="email"
          placeholder="email"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
        <PasswordInput
          {...register("password", { required: "password is required" })}
          name="password"
          required
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
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
