import {useMutation} from "@tanstack/react-query";
import { login } from "../../../services/authService";

export const UseLogin = () => {
    return useMutation({
        mutationFn: login,
    });
}