import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLogo from "../components/AuthLogo.jsx";
import { apiPost } from "../services/api.js";

function normalizeDecision(input) {
  const v = String(input || "").trim().toLowerCase();
  if (v === "accept" || v === "accepted") return "Accepted";
  if (v === "decline" || v === "declined") return "Declined";
  return "";
}

function GuestRsvpPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "");
  const decision = normalizeDecision(searchParams.get("decision"));
  const hostName = String(searchParams.get("hostName") || "").trim();
  const hostEmail = String(searchParams.get("hostEmail") || "").trim();
  const invalidLink = !token || !decision;
  const [status, setStatus] = useState(() =>
    invalidLink ? "" : "Processing your RSVP..."
  );
  const [error, setError] = useState(() =>
    invalidLink ? "Invalid RSVP link. Please contact your host for a new invitation." : ""
  );

  useEffect(() => {
    if (invalidLink) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiPost("/api/guest-rsvp/respond", { token, decision });
        if (!cancelled) {
          setError("");
          setStatus(res.message || "Your RSVP has been updated.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("");
          setError(err.message || "Unable to update RSVP.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, decision, invalidLink]);

  return (
    <div className="page-center dark-bg">
      <AuthLogo />
      <div className="card">
        <h2>Wedding RSVP</h2>
        {status ? <p className="msg ok">{status}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        {(hostName || hostEmail) && (
          <p className="tiny-note">
            Questions? Contact host{hostName ? ` ${hostName}` : ""}{" "}
            {hostEmail ? (
              <>
                at <a href={`mailto:${hostEmail}`}>{hostEmail}</a>
              </>
            ) : null}
            .
          </p>
        )}
        <p className="tiny-note">
          This RSVP link can be used only once. If you changed your mind or any situation arises, please contact the host for any update.
        </p>
      </div>
    </div>
  );  
}

export default GuestRsvpPage;
