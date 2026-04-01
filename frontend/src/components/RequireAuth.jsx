import { Navigate, useLocation } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../services/api.js";

function RequireAuth({ role, children }) {
  const location = useLocation();
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    const fallback = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default RequireAuth;
