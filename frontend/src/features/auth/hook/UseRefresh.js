import { refresh } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setCredential } from "../authSlice";

const UseRefresh = () => {
    const dispatch = useDispatch();
  return useMutation({
    mutationFn: refresh,
    onSuccess: (data) => {
      const user = data.data.user;
      const accessToken = data.data.accessToken;
      dispatch(setCredential({ user, accessToken }));
    },
  });
};

export default UseRefresh;
