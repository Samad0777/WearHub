import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import { UseRegister } from "../hook/UseRegister";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Register = ({ onSwitch }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm();
  const { mutate, isPending, isSuccess, isError, error } = UseRegister();

  const onSubmit = (data) => {
    mutate({ name: data.name, email: data.email, password: data.password });
  };

  useEffect(() => {
    if (isSuccess) {
      navigate("/email-resend", { state: { email: getValues("email") } });
      reset();
    }
  }, [getValues, isSuccess, navigate, reset]);

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
        <label>Username</label>
        <Input
          name="name"
          {...register("name", { required: "username is required" })}
          className="bg-white py-6 rounded-none"
          type="text"
          placeholder="username"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}

        <label>Email</label>
        <Input
          name="email"
          {...register("email", { required: "email is required" })}
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
          minLength={8}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
        <Button
          disabled={isPending}
          type="submit"
          className="w-full py-6 rounded-none cursor-pointer"
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
      <div className="flex gap-2 items-center justify-center p-2">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="cursor-pointer underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Register;
