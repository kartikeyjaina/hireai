import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/protected-route";
import PublicRoute from "@/components/auth/public-route";
import RoleHomeRedirect from "@/components/auth/role-home-redirect";
import RoleRoute from "@/components/auth/role-route";
import { AuthProvider } from "@/context/auth-context";
import DashboardShell from "@/components/dashboard-shell";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import CandidateDashboardPage from "@/pages/candidate-dashboard-page";
import InterviewerDashboardPage from "@/pages/interviewer-dashboard-page";
import CandidateProfilePage from "@/pages/candidate-profile-page";
import AnalyticsPage from "@/pages/analytics-page";
import CandidatesPage from "@/pages/candidates-page";
import InterviewsPage from "@/pages/interviews-page";
import JobsPage from "@/pages/jobs-page";
import LoginPage from "@/pages/login-page";
import NotificationsPage from "@/pages/notifications-page";
import PipelinePage from "@/pages/pipeline-page";
import PublicJobDetailsPage from "@/pages/public-job-details-page";
import PublicJobsPage from "@/pages/public-jobs-page";
import RecruiterDashboardPage from "@/pages/recruiter-dashboard-page";
import SignupPage from "@/pages/signup-page";
import UsersPage from "@/pages/users-page";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect based on role */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* Public job board — accessible to everyone */}
          <Route path="/jobs" element={<PublicJobsPage />} />
          <Route path="/jobs/:id" element={<PublicJobDetailsPage />} />

          {/* All authenticated users get the dashboard shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardShell />}>
              {/* /dashboard redirects to role-specific home */}
              <Route path="/dashboard" element={<RoleHomeRedirect />} />

              {/* Notifications — all authenticated roles */}
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* ── Candidate routes ── */}
              <Route element={<RoleRoute allowedRoles={["candidate"]} />}>
                <Route path="/dashboard/candidate" element={<CandidateDashboardPage />} />
              </Route>

              {/* ── Admin-only routes ── */}
              <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>

              {/* ── Admin + Recruiter routes ── */}
              <Route element={<RoleRoute allowedRoles={["admin", "recruiter"]} />}>
                <Route path="/dashboard/recruiter" element={<RecruiterDashboardPage />} />
                <Route path="/candidates" element={<CandidatesPage />} />
                <Route path="/candidates/:candidateId" element={<CandidateProfilePage />} />
                <Route path="/dashboard/jobs" element={<JobsPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* ── Admin + Recruiter + Interviewer routes ── */}
              <Route element={<RoleRoute allowedRoles={["admin", "recruiter", "interviewer"]} />}>
                <Route path="/dashboard/interviewer" element={<InterviewerDashboardPage />} />
                <Route path="/interviews" element={<InterviewsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Auth pages — redirect away if already logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
