export const ROLE_HOME_PATHS = {
  admin: "/dashboard/admin",
  recruiter: "/dashboard/recruiter",
  interviewer: "/dashboard/interviewer",
  candidate: "/jobs"
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] || ROLE_HOME_PATHS.candidate;
}

export function canCreateJobs(role) {
  return role === "admin" || role === "recruiter";
}

export function getRoleNavItems(role) {
  if (role === "admin") {
    return [
      { label: "Dashboard", value: "overview", href: "/dashboard/admin" },
      { label: "Analytics", value: "analytics", href: "/analytics" },
      { label: "Jobs", value: "jobs", href: "/dashboard/jobs" },
      { label: "Candidates", value: "candidates", href: "/candidates" },
      { label: "Pipeline", value: "pipeline", href: "/pipeline" },
      { label: "Users", value: "users", href: "/users" },
      {
        label: "Notifications",
        value: "notifications",
        href: "/notifications",
      },
    ];
  }

  if (role === "interviewer") {
    return [
      { label: "Dashboard", value: "overview", href: "/dashboard/interviewer" },
      { label: "Interviews", value: "interviews", href: "/interviews" },
      {
        label: "Notifications",
        value: "notifications",
        href: "/notifications",
      },
    ];
  }

  return [
    { label: "Dashboard", value: "overview", href: "/dashboard/recruiter" },
    { label: "Candidates", value: "candidates", href: "/candidates" },
    { label: "Jobs", value: "jobs", href: "/dashboard/jobs" },
    { label: "Pipeline", value: "pipeline", href: "/pipeline" },
    { label: "Analytics", value: "analytics", href: "/analytics" },
    { label: "Notifications", value: "notifications", href: "/notifications" },
  ];
}
