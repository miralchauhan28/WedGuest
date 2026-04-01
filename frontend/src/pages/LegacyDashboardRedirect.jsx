import { Navigate } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../services/api.js";

function LegacyDashboardRedirect() {
  const token = getStoredToken();
  const user = getStoredUser();
  if (!token || !user) return <Navigate to="/" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

export default LegacyDashboardRedirect;
