import { getMe } from "../../../services/authService"
import { useQuery } from "@tanstack/react-query"

const UseGetMe = () => {
  return useQuery({
    queryKey:["user"],
    queryFn:getMe,
  })
}

export default UseGetMe