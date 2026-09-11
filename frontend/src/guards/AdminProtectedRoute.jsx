import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const { data: user } = useQueryClient();
  if (user.role !== "admin") {
    return;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return children;
};

export default AdminProtectedRoute;
