import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { getRoleHomePath } from "@/lib/roles";

function PublicRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
