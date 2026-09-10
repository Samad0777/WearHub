import { useMutation } from "@tanstack/react-query";
import { register } from "../../../services/authService";


export const UseRegister = () => {
    return useMutation({
    mutationFn: register,
  });
};
