import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import PasswordInput from "./PasswordInput";

const Register = ({ onSwitch}) => {

  const handleSubmit = async (event) => {
    event.preventDefault();
  };
  return (
    <div className="w-full max-w-lg p-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>Username</label>
        <Input name="name" required className="bg-white py-6 rounded-none" type="text" placeholder="username" />
        <label>Email</label>
        <Input name="email" required className="bg-white py-6 rounded-none" type="email" placeholder="email" />
        <PasswordInput name="password" required minLength={8} />
        <Button type="submit" className="w-full py-6 rounded-none cursor-pointer">
            Create Account
        </Button>
      </form>
      <div className="flex gap-2 items-center justify-center p-2">
        Already have an account? <button type="button" onClick={onSwitch} className="cursor-pointer underline">Sign In</button>
      </div>
    </div>
  );
};

export default Register;
