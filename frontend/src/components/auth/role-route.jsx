import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getRoleHomePath } from "@/lib/roles";

function RoleRoute({ allowedRoles = [] }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  const role = user?.role;

  if (!role || (allowedRoles.length && !allowedRoles.includes(role))) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
