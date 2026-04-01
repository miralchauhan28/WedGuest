import nodemailer from "nodemailer";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const fromAddress = process.env.EMAIL_USER;
const allowSelfSigned = String(process.env.SMTP_ALLOW_SELF_SIGNED || "").toLowerCase() === "true";


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: !allowSelfSigned,
  },
});

export async function sendVerificationEmail(to, link) {
  if (!fromAddress) {
    throw new Error("EMAIL_USER is not set in backend/.env");
  }

  await transporter.sendMail({
    from: `"WedGuest Admin" <${fromAddress}>`,
    to,
    subject: "Verify your WedGuest account",
    html: `
      <p>Hello,</p>
      <p>Thank you for signing up to <strong>WedGuest</strong>.</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      <p><a href="${link}" style="background:#050A24;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${link}">${link}</a></p>
    `,
  });
}

export async function sendResetPasswordEmail(to, link) {
  if (!fromAddress) {
    throw new Error("EMAIL_USER is not set in backend/.env");
  }

  await transporter.sendMail({
    from: `"WedGuest Admin" <${fromAddress}>`,
    to,
    subject: "Reset your WedGuest password",
    html: `
      <p>Hello,</p>
      <p>We received a request to reset your password for your <strong>WedGuest</strong> account.</p>
      <p>Click the button below to open the reset password page (link expires in 15 minutes):</p>
      <p><a href="${link}" style="background:#050A24;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break:break-all;"><a href="${link}">${link}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendGuestInvitationEmail({
  to,
  guestName,
  coupleName,
  weddingDateText,
  location,
  acceptLink,
  declineLink,
  hostName,
  hostEmail,
}) {
  if (!fromAddress) {
    throw new Error("EMAIL_USER is not set in backend/.env");
  }

  const safeGuest = guestName || "Guest";
  const safeCouple = coupleName || "Wedding Host";
  const safeDate = weddingDateText || "Date to be confirmed";
  const safeLocation = location || "Location to be confirmed";
  const safeHostName = hostName || "Wedding Host";
  const safeHostEmail = hostEmail || "";

  await transporter.sendMail({
    from: `"WedGuest Team" <${fromAddress}>`,
    to,
    subject: `You're invited: ${safeCouple}`,
    html: `
      <div style="background:#f3f4f8;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#050A24;padding:18px 22px;color:#ffffff;">
            <h1 style="margin:0;font-size:24px;font-style:italic;letter-spacing:1px;">WEDGUEST</h1>
          </div>
          <div style="padding:24px 22px;">
            <p style="margin:0 0 10px;">Hi <strong>${safeGuest}</strong>,</p>
            <p style="margin:0 0 14px;">You are invited to <strong>${safeCouple}</strong>'s Wedding.</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin:0 0 16px;">
              <p style="margin:0 0 6px;"><strong>Date:</strong> ${safeDate}</p>
              <p style="margin:0;"><strong>Location:</strong> ${safeLocation}</p>
            </div>
            <p style="margin:0 0 12px;">Please respond to this invitation:</p>
            <div style="display:flex;gap:18px;flex-wrap:wrap;margin:0 0 14px;">
              <a href="${acceptLink}" style="background:#16a34a;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-right:5px;">Accept</a>
              <a href="${declineLink}" style="background:#dc2626;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-left:5px;">Decline</a>
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;margin:0 0 14px;">
              <p style="margin:0 0 6px;font-size:13px;color:#374151;">Questions about the event?</p>
              <p style="margin:0;font-size:13px;color:#111827;">
                Contact host: <strong>${safeHostName}</strong>
                ${safeHostEmail ? ` • <a href="mailto:${safeHostEmail}" style="color:#2f3068;text-decoration:none;">${safeHostEmail}</a>` : ""}
              </p>
            </div>
            <p style="margin:0 0 6px;color:#4b5563;font-size:13px;">If the buttons do not open, copy one of these links:</p>
            <p style="margin:0 0 4px;font-size:13px;word-break:break-all;"><a href="${acceptLink}">${acceptLink}</a></p>
            <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${declineLink}">${declineLink}</a></p>
          </div>
        </div>
      </div>
    `,
  });
}
