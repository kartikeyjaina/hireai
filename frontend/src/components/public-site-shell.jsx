import { Link, NavLink } from "react-router-dom";
import { BriefcaseBusiness, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

function PublicSiteShell({ children }) {
  const { isAuthenticated, logout, user } = useAuth();
  const isInternalUser =
    user?.role === "admin" || user?.role === "recruiter" || user?.role === "interviewer";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.14),_transparent_30%),linear-gradient(180deg,_rgba(10,14,23,1)_0%,_rgba(9,11,18,1)_100%)] text-foreground">
      <header className="border-b border-border/70 bg-slate-950/55 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/jobs" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                HireAI
              </div>
              <div className="text-sm text-muted-foreground">
                Public careers
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <NavLink
              to="/jobs"
              className="rounded-full border border-border/80 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              Jobs
            </NavLink>
            {isInternalUser ? (
              <Button asChild variant="secondary">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : null}
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Signup</Link>
                </Button>
              </>
            ) : null}
            {isAuthenticated ? (
              <Button variant="secondary" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export default PublicSiteShell;
