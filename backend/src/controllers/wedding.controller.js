import Guest from "../models/Guest.js";
import Wedding from "../models/Wedding.js";
import User from "../models/User.js";
import { createAdminNotification } from "../services/adminNotificationService.js";

function validateWeddingBody(body) {
  const { coupleName, weddingDate, location } = body || {};
  const name = String(coupleName || "").trim();
  if (name.length < 2) return { ok: false, message: "Name must be at least 2 characters." };
  if (!weddingDate) return { ok: false, message: "Date is required." };
  const d = new Date(weddingDate);
  if (Number.isNaN(d.getTime())) return { ok: false, message: "Invalid date." };
  const loc = String(location || "").trim();
  if (loc.length < 2) return { ok: false, message: "Location must be at least 2 characters." };
  return { ok: true, value: { coupleName: name, weddingDate: d, location: loc } };
}

export async function listWeddings(req, res) {
  const list = await Wedding.find({ userId: req.userId }).sort({ weddingDate: 1 }).lean();
  const withGuestCounts = await Promise.all(
    list.map(async (w) => {
      const g = await Guest.countDocuments({ weddingId: w._id });
      return { ...w, guestCount: g };
    })
  );
  res.json({ weddings: withGuestCounts });
}

export async function createWedding(req, res) {
  const check = validateWeddingBody(req.body);
  if (!check.ok) return res.status(400).json({ message: check.message });

  const doc = await Wedding.create({
    userId: req.userId,
    ...check.value,
  });
  const owner = await User.findById(req.userId).lean();
  await createAdminNotification(
    "New wedding created",
    `${owner?.name || "A user"} created wedding "${doc.coupleName}" scheduled for ${doc.weddingDate.toDateString()} at ${doc.location}.`
  );
  res.status(201).json({ message: "Wedding created.", wedding: doc });
}

export async function getWedding(req, res) {
  const w = await Wedding.findOne({ _id: req.params.id, userId: req.userId });
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  const guestCount = await Guest.countDocuments({ weddingId: w._id });
  res.json({ wedding: { ...w.toObject(), guestCount } });
}

export async function updateWedding(req, res) {
  const check = validateWeddingBody(req.body);
  if (!check.ok) return res.status(400).json({ message: check.message });

  const w = await Wedding.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: check.value },
    { new: true }
  );
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  res.json({ message: "Wedding updated.", wedding: w });
}

export async function deleteWedding(req, res) {
  const w = await Wedding.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!w) return res.status(404).json({ message: "Wedding not found." });
  await Guest.deleteMany({ weddingId: w._id });
  res.json({ message: "Wedding deleted." });
}
