import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AdminLayout from "./components/AdminLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import UserLayout from "./components/UserLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import GuestRsvpPage from "./pages/GuestRsvpPage.jsx";
import LegacyDashboardRedirect from "./pages/LegacyDashboardRedirect.jsx";
import UserDashboardPage from "./pages/UserDashboardPage.jsx";
import WeddingsPage from "./pages/WeddingsPage.jsx";
import WeddingGuestsPage from "./pages/WeddingGuestsPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminWeddingsPage from "./pages/AdminWeddingsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminNotificationsPage from "./pages/AdminNotificationsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/guest-rsvp" element={<GuestRsvpPage />} />
      <Route path="/dashboard" element={<LegacyDashboardRedirect />} />

      <Route
        path="/user"
        element={
          <RequireAuth role="user">
            <UserLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="weddings" element={<WeddingsPage />} />
        <Route path="weddings/:weddingId/guests" element={<WeddingGuestsPage />} />
        <Route path="profile" element={<UserProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="weddings" element={<AdminWeddingsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
      </Route>

    </Routes>
  );
}

export default App;
