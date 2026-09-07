import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";
import { UseRegister } from "../hook/UseRegister";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Register = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, getValues } = useForm();
  const { mutate, isPending, isSuccess, isError, error } = UseRegister();

  const onSubmit = (data) => {
    mutate({ name: data.name, email: data.email, password: data.password });
  };

  useEffect(() => {
    if (isSuccess) {
      navigate("/email-resend", { state: { email: getValues("email") } });
    }

    if (isPending) {
      return <div>Loading...</div>;
    }
  }, [getValues, isSuccess, navigate]);

  return (
    <div className="w-full max-w-lg p-2">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <label>Username</label>
        <Input
          name="name"
          {...register("name", { required: true })}
          className="bg-white py-6 rounded-none"
          type="text"
          placeholder="username"
        />
        <label>Email</label>
        <Input
          name="email"
          {...register("email", { required: true })}
          className="bg-white py-6 rounded-none"
          type="email"
          placeholder="email"
        />
        <PasswordInput
          {...register("password", { required: true })}
          name="password"
          required
          minLength={8}
        />
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
