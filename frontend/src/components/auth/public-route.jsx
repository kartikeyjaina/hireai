import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

function PublicRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
