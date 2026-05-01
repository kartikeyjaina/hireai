import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";

function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Skeleton className="min-h-[calc(100vh-3rem)] w-full rounded-[28px]" />
          <div className="grid gap-6">
            <Skeleton className="h-20 w-full rounded-[28px]" />
            <Skeleton className="h-72 w-full rounded-[28px]" />
            <Skeleton className="h-96 w-full rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
