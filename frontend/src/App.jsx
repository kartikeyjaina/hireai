import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/protected-route";
import PublicRoute from "@/components/auth/public-route";
import { AuthProvider } from "@/context/auth-context";
import DashboardShell from "@/components/dashboard-shell";
import CandidateProfilePage from "@/pages/candidate-profile-page";
import AnalyticsPage from "@/pages/analytics-page";
import CandidatesPage from "@/pages/candidates-page";
import JobsPage from "@/pages/jobs-page";
import LoginPage from "@/pages/login-page";
import NotificationsPage from "@/pages/notifications-page";
import OverviewPage from "@/pages/overview-page";
import PipelinePage from "@/pages/pipeline-page";
import SignupPage from "@/pages/signup-page";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardShell />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:candidateId" element={<CandidateProfilePage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
