import { verifyEmail } from "../../../services/authService";
import { useMutation } from "@tanstack/react-query";

export const UseVerifyEmail = () => {
    return useMutation({
    mutationFn: verifyEmail,
  });
}