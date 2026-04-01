import { Link } from "react-router-dom";
import { useState } from "react";
import AuthLogo from "../components/AuthLogo.jsx";
import { Alert } from "../components/Alert.jsx";
import { apiPost } from "../services/api.js";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/forgot-password", { email });
      setEmail("");
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
        <h2>Forgot Password?</h2>
        <p className="subtext">No worries! Enter your email and we&apos;ll send you a password reset link.</p>
        <form className="form" onSubmit={onSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Link"}
          </button>
        </form>
        {error && (
          <Alert variant="error" key={error} onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert variant="success" key={info} onDismiss={() => setInfo("")}>
            {info}
          </Alert>
        )}
        <p className="muted-center">
          <Link to="/">Back to Login</Link>
        </p>
        <p className="muted-center">
          Having Trouble? <a href="#">Reach Out To Support</a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
