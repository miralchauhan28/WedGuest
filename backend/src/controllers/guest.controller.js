import Guest from "../models/Guest.js";
import User from "../models/User.js";
import Wedding from "../models/Wedding.js";
import { validateEmail } from "../utils/authValidation.js";
import { normalizeAttendee, normalizeRsvp } from "../utils/guestFields.js";
import { createGuestRsvpLink } from "../utils/appUrls.js";
import { createVerificationToken, hashToken } from "../utils/tokens.js";
import { sendGuestInvitationEmail } from "../services/mailService.js";
import { createAdminNotification } from "../services/adminNotificationService.js";

async function ensureWeddingAccess(weddingId, userId) {
  return Wedding.findOne({ _id: weddingId, userId });
}

function validateGuestPayload(body, partial = false) {
  const { name, email, phone, attendee, mealPreference, rsvpStatus } = body || {};
  const n = String(name || "").trim();
  if (!partial && n.length < 2) return { ok: false, message: "Name must be at least 2 characters." };
  if (partial && name !== undefined && n.length > 0 && n.length < 2) {
    return { ok: false, message: "Name must be at least 2 characters." };
  }

  const em = String(email || "").trim().toLowerCase();
  if (!partial || email !== undefined) {
    const eCheck = validateEmail(em);
    if (!eCheck.ok) return { ok: false, message: eCheck.message };
  }

  const ph = String(phone || "").trim();
  if (!partial && ph.length < 6) return { ok: false, message: "Phone must be at least 6 characters." };
  if (partial && phone !== undefined && ph.length > 0 && ph.length < 6) {
    return { ok: false, message: "Phone must be at least 6 characters." };
  }

  const att = normalizeAttendee(attendee);
  if (!partial && !att) return { ok: false, message: "Attendee must be Yes or No." };
  if (partial && attendee !== undefined && !normalizeAttendee(attendee)) {
    return { ok: false, message: "Attendee must be Yes or No." };
  }

  const meal = String(mealPreference ?? "").trim();
  if (meal.length > 80) return { ok: false, message: "Meal preference is too long." };

  const rsvp = normalizeRsvp(rsvpStatus);
  if (!partial && !rsvp) return { ok: false, message: "RSVP status must be Pending, Accepted, or Declined." };
  if (partial && rsvpStatus !== undefined && !normalizeRsvp(rsvpStatus)) {
    return { ok: false, message: "RSVP status must be Pending, Accepted, or Declined." };
  }

  return {
    ok: true,
    value: {
      name: n,
      email: em,
      phone: ph,
      attendee: att || normalizeAttendee(body.attendee),
      mealPreference: meal,
      rsvpStatus: rsvp || normalizeRsvp(body.rsvpStatus),
    },
  };
}

export async function listGuests(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });

  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
  const skip = (page - 1) * limit;

  const search = String(req.query.search || "").trim();
  const attendee = String(req.query.attendee || "").trim();
  const mealPref = String(req.query.mealPref || "").trim();
  const rsvp = String(req.query.rsvp || "").trim();

  const filter = { weddingId: req.params.weddingId };

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (attendee && (attendee === "Yes" || attendee === "No")) filter.attendee = attendee;
  if (mealPref) filter.mealPreference = mealPref;
  if (rsvp && ["Pending", "Accepted", "Declined"].includes(rsvp)) filter.rsvpStatus = rsvp;

  const [total, guests] = await Promise.all([
    Guest.countDocuments(filter),
    Guest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    guests,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function createGuest(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  const host = await User.findById(req.userId).lean();
  const check = validateGuestPayload(req.body, false);
  if (!check.ok) return res.status(400).json({ message: check.message });

  try {
    const invitationToken = createVerificationToken();
    const g = await Guest.create({
      weddingId: req.params.weddingId,
      ...check.value,
      rsvpStatus: "Pending",
      invitationTokenHash: hashToken(invitationToken),
      invitationTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });

    const acceptLink = createGuestRsvpLink(invitationToken, "accepted", {
      hostName: host?.name,
      hostEmail: host?.email,
    });
    const declineLink = createGuestRsvpLink(invitationToken, "declined", {
      hostName: host?.name,
      hostEmail: host?.email,
    });
    const weddingDateText = new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(w.weddingDate));

    let invitationEmailSent = true;
    try {
      await sendGuestInvitationEmail({
        to: g.email,
        guestName: g.name,
        coupleName: w.coupleName,
        weddingDateText,
        location: w.location,
        acceptLink,
        declineLink,
        hostName: host?.name,
        hostEmail: host?.email,
      });
    } catch (mailErr) {
      invitationEmailSent = false;
      console.error("Failed to send invitation email:", mailErr.message);
    }
    res.status(201).json({
      message: invitationEmailSent
        ? "Guest added and invitation email sent."
        : "Guest added, but invitation email could not be sent.",
      invitationEmailSent,
      guest: g,
    });
    await createAdminNotification(
      "Guest added",
      `${host?.name || "A user"} added guest "${g.name}" to "${w.coupleName}".`
    );
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A guest with this email already exists for this wedding." });
    }
    throw err;
  }
}

export async function respondGuestInvitation(req, res) {
  const token = String(req.body?.token || "").trim();
  const decision = normalizeRsvp(req.body?.decision);

  if (!token) return res.status(400).json({ message: "Invitation token is required." });
  if (!decision || decision === "Pending") {
    return res.status(400).json({ message: "Decision must be accepted or declined." });
  }

  const guest = await Guest.findOne({ invitationTokenHash: hashToken(token) });
  if (!guest) return res.status(404).json({ message: "Invitation link is invalid." });

  if (guest.invitationRespondedAt) {
    return res.status(409).json({
      message:
        "This RSVP link has already been used. If you changed your mind or any situation arises, please contact the host for any update.",
    });
  }

  if (!guest.invitationTokenExpiresAt || guest.invitationTokenExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "Invitation link has expired." });
  }

  guest.rsvpStatus = decision;
  guest.invitationRespondedAt = new Date();
  await guest.save();

  return res.json({
    message:
      decision === "Accepted"
        ? "Thanks! Your RSVP was accepted. If you changed your mind or any situation arises, please contact the host for any update."
        : "Your RSVP was marked as declined. If you changed your mind or any situation arises, please contact the host for any update.",
    rsvpStatus: guest.rsvpStatus,
  });
}

export async function updateGuest(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  const actor = await User.findById(req.userId).select("name").lean();
  const existing = await Guest.findOne({ _id: req.params.guestId, weddingId: req.params.weddingId });
  if (!existing) return res.status(404).json({ message: "Guest not found." });

  const merged = {
    name: req.body.name !== undefined ? req.body.name : existing.name,
    email: req.body.email !== undefined ? req.body.email : existing.email,
    phone: req.body.phone !== undefined ? req.body.phone : existing.phone,
    attendee: req.body.attendee !== undefined ? req.body.attendee : existing.attendee,
    mealPreference: req.body.mealPreference !== undefined ? req.body.mealPreference : existing.mealPreference,
    rsvpStatus: req.body.rsvpStatus !== undefined ? req.body.rsvpStatus : existing.rsvpStatus,
  };

  const check = validateGuestPayload(merged, false);
  if (!check.ok) return res.status(400).json({ message: check.message });

  try {
    existing.set(check.value);
    await existing.save();
    await createAdminNotification(
      "Guest updated",
      `${actor?.name || "A user"} updated guest "${existing.name}" in "${w.coupleName}".`
    );
    res.json({ message: "Guest updated.", guest: existing });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A guest with this email already exists for this wedding." });
    }
    throw err;
  }
}

export async function deleteGuest(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  const actor = await User.findById(req.userId).select("name").lean();
  const g = await Guest.findOneAndDelete({ _id: req.params.guestId, weddingId: req.params.weddingId });
  if (!g) return res.status(404).json({ message: "Guest not found." });
  await createAdminNotification(
    "Guest deleted",
    `${actor?.name || "A user"} deleted guest "${g.name}" from "${w.coupleName}".`
  );
  res.json({ message: "Guest removed." });
}

export async function downloadTemplate(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });

  const csv =
    "Name,Email,Phone,Attendee,Meal Pref,RSVP Status\r\n" +
    "Liam Thompson,liam@example.com,0412345678,Yes,Vegetarian,Pending\r\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="wedguest-guests-template.csv"');
  res.send(csv);
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
    } else if (c === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export async function bulkUploadGuests(req, res) {
  const w = await ensureWeddingAccess(req.params.weddingId, req.userId);
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  const actor = await User.findById(req.userId).select("name").lean();

  if (!req.file?.buffer) {
    return res.status(400).json({ message: "Upload a CSV file." });
  }

  const text = req.file.buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return res.status(400).json({ message: "CSV must include a header row and at least one data row." });
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name) => header.findIndex((h) => h === name.toLowerCase());

  const iName = idx("name");
  const iEmail = idx("email");
  const iPhone = idx("phone");
  const iAtt = idx("attendee");
  const iMeal = idx("meal pref");
  const iRsvp = idx("rsvp status");

  if (iName < 0 || iEmail < 0 || iPhone < 0 || iAtt < 0 || iMeal < 0 || iRsvp < 0) {
    return res.status(400).json({
      message:
        "CSV must have columns: Name, Email, Phone, Attendee, Meal Pref, RSVP Status (header row).",
    });
  }

  const imported = [];
  const errors = [];

  for (let r = 1; r < lines.length; r += 1) {
    const cells = parseCsvLine(lines[r]);
    const row = {
      name: cells[iName] ?? "",
      email: cells[iEmail] ?? "",
      phone: cells[iPhone] ?? "",
      attendee: cells[iAtt] ?? "",
      mealPreference: cells[iMeal] ?? "",
      rsvpStatus: cells[iRsvp] ?? "",
    };

    const check = validateGuestPayload(row, false);
    if (!check.ok) {
      errors.push({ row: r + 1, message: check.message });
      continue;
    }

    try {
      const g = await Guest.create({
        weddingId: req.params.weddingId,
        ...check.value,
      });
      imported.push(g._id);
    } catch (err) {
      if (err.code === 11000) {
        errors.push({ row: r + 1, message: "Duplicate email for this wedding." });
      } else {
        errors.push({ row: r + 1, message: err.message || "Save failed" });
      }
    }
  }

  res.json({
    message: `Imported ${imported.length} guest(s).${errors.length ? ` ${errors.length} row(s) skipped.` : ""}`,
    imported: imported.length,
    errors,
  });
  if (imported.length > 0) {
    await createAdminNotification(
      "Bulk guest import",
      `${actor?.name || "A user"} imported ${imported.length} guest(s) to "${w.coupleName}".`
    );
  }
}
