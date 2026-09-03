import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "./PasswordInput";

const Login = ({ onSwitch}) => {

  const handleSubmit = async (event) => {
    event.preventDefault();
  };

  return (
    <div className="w-full max-w-lg p-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>Email</label>
        <Input name="email" required className="bg-white py-6 rounded-none" type="email" placeholder="email" />
        <PasswordInput name="password" required />
        <Button type="submit" className="w-full py-6 rounded-none cursor-pointer">
            Sign In
        </Button>
        <div className="flex items-center justify-center md:justify-end mb-2">
            <button type="button" className="cursor-pointer underline">Forgot password?</button>
        </div>
      </form>
      <div className="flex gap-2 items-center justify-center p-2">
        New to WearHub? <button type="button" onClick={onSwitch} className="cursor-pointer underline">Register</button>
      </div>
    </div>
  )
}

export default Login