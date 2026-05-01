import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/protected-route";
import PublicRoute from "@/components/auth/public-route";
import RoleHomeRedirect from "@/components/auth/role-home-redirect";
import RoleRoute from "@/components/auth/role-route";
import { AuthProvider } from "@/context/auth-context";
import DashboardShell from "@/components/dashboard-shell";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import InterviewerDashboardPage from "@/pages/interviewer-dashboard-page";
import CandidateProfilePage from "@/pages/candidate-profile-page";
import AnalyticsPage from "@/pages/analytics-page";
import CandidatesPage from "@/pages/candidates-page";
import InterviewsPage from "@/pages/interviews-page";
import JobsPage from "@/pages/jobs-page";
import LoginPage from "@/pages/login-page";
import NotificationsPage from "@/pages/notifications-page";
import PipelinePage from "@/pages/pipeline-page";
import RecruiterDashboardPage from "@/pages/recruiter-dashboard-page";
import SignupPage from "@/pages/signup-page";
import UsersPage from "@/pages/users-page";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardShell />}>
              <Route path="/candidates/:candidateId" element={<CandidateProfilePage />} />
              <Route path="/" element={<RoleHomeRedirect />} />
              <Route path="/dashboard" element={<RoleHomeRedirect />} />

              <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={["admin", "recruiter"]} />}>
                <Route path="/dashboard/recruiter" element={<RecruiterDashboardPage />} />
                <Route path="/candidates" element={<CandidatesPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={["admin", "recruiter", "interviewer"]} />}>
                <Route path="/dashboard/interviewer" element={<InterviewerDashboardPage />} />
                <Route path="/interviews" element={<InterviewsPage />} />
              </Route>

              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
