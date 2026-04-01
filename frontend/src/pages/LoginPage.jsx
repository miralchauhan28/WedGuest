import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthLogo from "../components/AuthLogo.jsx";
import { Alert } from "../components/Alert.jsx";
import { apiPost, setAuth } from "../services/api.js";
import { getSupportEmail, getSupportMailto } from "../utils/support.js";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/login", { email, password });
      if (data.token) {
        setAuth(data.token, data.user);
      } else {
        localStorage.setItem("wedguest_user", JSON.stringify(data.user));
      }
      const dest = data.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
      navigate(dest);
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
        <h2>Login to your account</h2>
        <form className="form" onSubmit={onSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="row-between">
            <label>Password</label>
            <Link className="inline-link" to="/forgot-password">
              Forgot ?
            </Link>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login now"}
          </button>
        </form>

        {error && (
          <Alert variant="error" key={error} onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <p className="muted-center">
          Don&apos;t Have An Account ? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="muted-center">
          Having Trouble?{" "}
          <a href={getSupportMailto("WedGuest Login Support")} target="_blank" rel="noreferrer">
            Reach Out To Support
          </a>{" "}
          ({getSupportEmail()})
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
