import { Bell, LogOut, Menu, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function TopNav({ onCreateJob, onLogout, onOpenSidebar, user }) {
  const navigate = useNavigate();

  return (
    <header className="surface-panel sticky top-4 z-30 mb-6 flex items-center gap-3 px-4 py-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-border/80 bg-secondary/60 px-4 py-3 sm:flex">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm text-muted-foreground">
          Search candidates, jobs, interview plans, and notes
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden rounded-full border border-border/80 bg-secondary/60 px-4 py-2 text-right sm:block">
          <div className="text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {user.role}
          </div>
        </div>
        <Button variant="secondary" size="icon" onClick={() => navigate("/notifications")}>
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
        <Button onClick={onCreateJob}>
          <Plus className="mr-2 h-4 w-4" />
          New job
        </Button>
      </div>
    </header>
  );
}

export default TopNav;
