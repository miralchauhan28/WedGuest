import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthLogo from "../components/AuthLogo.jsx";
import { Alert } from "../components/Alert.jsx";
import { apiGet } from "../services/api.js";

const VERIFY_CACHE_PREFIX = "wedguest_verify_ok:";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const cacheKey = token ? `${VERIFY_CACHE_PREFIX}${token}` : null;
  const cachedMsg = cacheKey ? sessionStorage.getItem(cacheKey) : null;

  const [status, setStatus] = useState(() => {
    if (!token) return "";
    if (cachedMsg) return cachedMsg;
    return "Verifying your email...";
  });
  const [error, setError] = useState(() => (!token ? "Verification token is missing." : ""));

  useEffect(() => {
    if (!token || !cacheKey) return;
    if (sessionStorage.getItem(cacheKey)) return;

    let cancelled = false;

    async function verify() {
      try {
        const data = await apiGet(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        sessionStorage.setItem(cacheKey, data.message);
        setStatus(data.message);
        setError("");
      } catch (err) {
        if (cancelled) return;
        const fromCache = sessionStorage.getItem(cacheKey);
        if (fromCache) {
          setStatus(fromCache);
          setError("");
          return;
        }
        setError(err.message);
        setStatus("");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, cacheKey]);

  const showSuccess =
    Boolean(status) &&
    (status.includes("Verification successful") || status.includes("login successfully"));
  const showError = Boolean(error) && !showSuccess;

  const isVerifying = status === "Verifying your email...";

  return (
    <div className="page-center dark-bg">
      <AuthLogo />
      <div className="card">
        <h2>Email Verification</h2>
        {isVerifying && !showSuccess && !showError && (
          <p className="msg ok verify-pending">Verifying your email...</p>
        )}
        {showSuccess && status && !isVerifying && (
          <Alert variant="success" key={status} onDismiss={() => setStatus("")} autoDismiss={false}>
            {status}
          </Alert>
        )}
        {showError && error && (
          <Alert variant="error" key={error} onDismiss={() => setError("")} autoDismiss={false}>
            {error}
          </Alert>
        )}
        <p className="muted-center">
          <Link to="/">Go to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
