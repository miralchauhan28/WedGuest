import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import AuthLogo from "../components/AuthLogo.jsx";
import { Alert } from "../components/Alert.jsx";
import { apiPost } from "../services/api.js";
import { validatePassword } from "../utils/validation.js";
import { getSupportEmail, getSupportMailto } from "../utils/support.js";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!token) {
      setError("Reset token is missing. Open this page from the reset link sent to email.");
      return;
    }
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must include ${passwordErrors.join(", ")}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost("/api/auth/reset-password", { token, password, confirmPassword });
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center dark-bg">
      <AuthLogo />
      <div className="card">
        <h2>Reset Password</h2>
        <form className="form" onSubmit={onSubmit}>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset"}
          </button>
        </form>
        {error && (
          <Alert variant="error" key={error} onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert variant="success" key={info} onDismiss={() => setInfo("")}>
            {info} <Link to="/">Go to Login</Link>
          </Alert>
        )}
        <p className="muted-center">
          <Link to="/">Back to Login</Link>
        </p>
        <p className="muted-center">
          Having Trouble?{" "}
          <a href={getSupportMailto("WedGuest Password Help")} target="_blank" rel="noreferrer">
            Reach Out To Support
          </a>{" "}
          ({getSupportEmail()})
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
