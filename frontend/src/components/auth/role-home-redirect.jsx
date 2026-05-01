import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getRoleHomePath } from "@/lib/roles";

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
}

export default RoleHomeRedirect;
