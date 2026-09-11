import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../../../services/authService";

export const UseLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user = data.data.user;
      queryClient.setQueryData(["user"], user);
    },
  });
};
