import {
  BarChart3,
  BriefcaseBusiness,
  Command,
  LayoutDashboard,
  PanelLeftClose,
  Bell,
  CalendarClock,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getRoleNavItems } from "@/lib/roles";

const icons = {
  overview: LayoutDashboard,
  candidates: Users,
  jobs: BriefcaseBusiness,
  pipeline: PanelLeftClose,
  analytics: BarChart3,
  users: Users,
  interviews: CalendarClock,
  notifications: Bell
};

function DashboardSidebar({ mobileOpen, onNavigate, role }) {
  const location = useLocation();
  const navItems = getRoleNavItems(role);

  return (
    <aside
      className={cn(
        "surface-panel fixed inset-y-4 left-4 z-40 w-[280px] overflow-hidden p-4 transition-transform duration-300 lg:static lg:inset-auto lg:w-full lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
      )}
    >
      <div className="soft-grid absolute inset-0 opacity-40" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-3 px-2 pb-6 pt-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Command className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              HireAI
            </div>
            <div className="text-sm text-muted-foreground">Hiring command center</div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = icons[item.value];
            const active = location.pathname === item.href;

            return (
              <motion.div
                key={item.value}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <NavLink
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                    active
                      ? "border-primary/35 bg-primary/12 text-foreground shadow-soft"
                      : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[24px] border border-border/80 bg-secondary/55 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {role === "admin"
              ? "Admin command"
              : role === "interviewer"
                ? "Interviewer loop"
                : "Recruiter workflow"}
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground">
            {role === "admin"
              ? "Cross-team hiring visibility in one place"
              : role === "interviewer"
                ? "Assigned interviews and feedback context"
                : "AI triage reduces screening time by 41%"}
          </div>
          <p className="mt-2 text-sm">
            {role === "admin"
              ? "Oversee analytics, users, jobs, and candidate flow from a single command surface."
              : role === "interviewer"
                ? "Focus on candidate packets, interview notes, and timely loop execution."
                : "Resume parsing, job drafting, and pipeline updates now build on the same reusable dashboard shell."}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
