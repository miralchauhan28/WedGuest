import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, clearAuth, setAuth, getStoredToken } from "../services/api.js";
import { validatePassword } from "../utils/validation.js";
import { confirmLogout, showError, showSuccess } from "../utils/swal.js";

function UserProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet("/api/user/me");
        if (!cancelled) {
          setName(res.user?.name || "");
          setEmail(res.user?.email || "");
        }
      } catch (e) {
        if (!cancelled) showError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onUpdateProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiPatch("/api/user/profile", { name });
      showSuccess(res.message || "Profile updated.");
      const token = getStoredToken();
      if (token && res.user) {
        setAuth(token, res.user);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    setSavingPass(true);
    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length) {
      showError(`Password must include ${pwdErrors.join(", ")}.`);
      setSavingPass(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New password and confirmation do not match.");
      setSavingPass(false);
      return;
    }
    try {
      const res = await apiPatch("/api/user/password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      showSuccess(res.message || "Password updated.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingPass(false);
    }
  }

  async function logout() {
    const ok = await confirmLogout();
    if (!ok) return;
    clearAuth();
    navigate("/");
  }

  return (
    <div className="user-page">
      <h1 className="user-page-title user-page-title--italic" style={{ marginBottom: "18px" }}>My Profile</h1>

      {loading ? (
        <p className="user-muted">Loading profile…</p>
      ) : (
        <div className="profile-grid">
          <section className="panel-card profile-card">
            <h2 className="profile-card-title">Update Details</h2>
            <form className="modal-form" onSubmit={onUpdateProfile}>
              <label>
                Name
                <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Email
                <input value={email} readOnly disabled className="input-muted" />
              </label>
              <button type="submit" className="btn-primary btn-block" disabled={savingProfile}>
                {savingProfile ? "Updating…" : "Update"}
              </button>
            </form>
            <p className="profile-logout-hint">
              Click{" "}
              <button type="button" className="link-button" onClick={logout}>
                Here
              </button>{" "}
              To Logout From Your Account!
            </p>
          </section>

          <section className="panel-card profile-card">
            <h2 className="profile-card-title">Change Password</h2>
            <form className="modal-form" onSubmit={onChangePassword}>
              <label className="password-field">
                Old Password
                <div className="password-input-wrap">
                  <input
                    type={showOld ? "text" : "password"}
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    aria-label="Toggle visibility"
                    onClick={() => setShowOld((v) => !v)}
                  >
                    {showOld ? "🙈" : "👁"}
                  </button>
                </div>
              </label>
              <label className="password-field">
                New Password
                <div className="password-input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    aria-label="Toggle visibility"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? "🙈" : "👁"}
                  </button>
                </div>
              </label>
              <label className="password-field">
                Confirm Password
                <div className="password-input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    aria-label="Toggle visibility"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? "🙈" : "👁"}
                  </button>
                </div>
              </label>
              <button type="submit" className="btn-primary btn-block" disabled={savingPass}>
                {savingPass ? "Updating…" : "Update"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
