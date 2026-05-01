import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard-sidebar";
import PageTransition from "@/components/page-transition";
import TopNav from "@/components/top-nav";
import { useAuth } from "@/context/auth-context";
import { canCreateJobs } from "@/lib/roles";
import { useState } from "react";

function DashboardShell() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <div className="min-h-screen px-4 py-4 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <DashboardSidebar
            mobileOpen={sidebarOpen}
            onNavigate={closeSidebar}
            role={user?.role}
          />

          <div className="min-w-0">
            <TopNav
              canCreateJob={canCreateJobs(user?.role)}
              onCreateJob={() => navigate("/jobs")}
              onLogout={logout}
              onOpenSidebar={() => setSidebarOpen(true)}
              user={user}
            />

            <main className="space-y-6 pb-8">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}
    </>
  );
}

export default DashboardShell;
