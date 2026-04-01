import { Link } from "react-router-dom";
import { useState } from "react";
import AuthLogo from "../components/AuthLogo.jsx";
import { Alert } from "../components/Alert.jsx";
import { apiPost } from "../services/api.js";
import { validatePassword } from "../utils/validation.js";
import { getSupportEmail, getSupportMailto } from "../utils/support.js";

function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      setError(`Password must include ${passwordErrors.join(", ")}.`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/signup", form);
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setInfo(data.message);
      if (data.verificationLink) {
        setInfo(`${data.message} Open the verification link from your email.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-layout">
      <section className="left-panel dark-bg">
        <AuthLogo />
        <h3 className="signup-text">
          Welcome!
          <br />
          Organize your wedding guests, invitations, and RSVPs effortlessly.
        </h3>
      </section>
      <section className="right-panel">
        <div className="card card-plain">
          <h2>Create an account</h2>
          <form className="form" onSubmit={onSubmit}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <label>Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
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
            Already Have An Account ? <Link to="/">Log In</Link>
          </p>
          <p className="muted-center">
            Having Trouble?{" "}
            <a href={getSupportMailto("WedGuest Signup Support")} target="_blank" rel="noreferrer">
              Reach Out To Support
            </a>{" "}
            ({getSupportEmail()})
          </p>
        </div>
      </section>
    </div>
  );
}

export default SignupPage;
