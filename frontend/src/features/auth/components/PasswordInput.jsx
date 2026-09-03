import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { EyeOff, Eye } from "lucide-react";

const PasswordInput = ({ name = "password", ...props }) => {
  const [showPassword, setshowPassword] = useState(false);
  const inputRef = useRef(null);
  return (
    <>
      <label>Password</label>
      <div
        onClick={() => inputRef.current?.focus()}
        className="bg-white flex items-center px-1 pr-3 border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
      >
        <Input
          ref={inputRef}
          name={name}
          type={showPassword ? "text" : "password"}
          className="py-6 rounded-none border-none focus-visible:ring-0 mr-4"
          placeholder="password"
          {...props}
        />
        {showPassword ? (
          <Eye
            onClick={() => setshowPassword(!showPassword)}
            className="cursor-pointer"
            size={20}
          />
        ) : (
          <EyeOff
            onClick={() => setshowPassword(!showPassword)}
            className="cursor-pointer"
            size={20}
          />
        )}
      </div>
    </>
  );
};

export default PasswordInput;
