import bcrypt from "bcryptjs";
import AdminNotification from "../models/AdminNotification.js";
import Guest from "../models/Guest.js";
import User from "../models/User.js";
import Wedding from "../models/Wedding.js";
import { validateEmail, validateName } from "../utils/authValidation.js";
import { createAdminNotification } from "../services/adminNotificationService.js";

function normalizeStatus(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "active") return true;
  if (s === "inactive") return false;
  return null;
}

export async function getAdminDashboard(req, res) {
  const [totalWeddings, totalUsers, totalGuests, pendingRsvp] = await Promise.all([
    Wedding.countDocuments({}),
    User.countDocuments({ role: "user" }),
    Guest.countDocuments({}),
    Guest.countDocuments({ rsvpStatus: "Pending" }),
  ]);

  const [accepted, declined, activeUsers] = await Promise.all([
    Guest.countDocuments({ rsvpStatus: "Accepted" }),
    Guest.countDocuments({ rsvpStatus: "Declined" }),
    User.countDocuments({ role: "user", isActive: true }),
  ]);
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);

  const monthRows = await Wedding.aggregate([
    {
      $group: {
        _id: { $month: "$weddingDate" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const monthMap = new Map(monthRows.map((m) => [m._id, m.count]));
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weddingsPerMonth = monthLabels.map((label, idx) => ({
    label,
    count: monthMap.get(idx + 1) || 0,
  }));

  const latestNotifications = await AdminNotification.find({}).sort({ createdAt: -1 }).limit(8).lean();

  res.json({
    stats: { totalWeddings, totalUsers, totalGuests, pendingRsvp },
    rsvpBreakdown: { accepted, pending: pendingRsvp, declined },
    userStatus: { active: activeUsers, inactive: inactiveUsers },
    weddingsPerMonth,
    latestNotifications,
  });
}

export async function listAdminWeddings(req, res) {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
  const skip = (page - 1) * limit;
  const search = String(req.query.search || "").trim();

  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ coupleName: rx }, { location: rx }];
  }

  const [total, docs] = await Promise.all([
    Wedding.countDocuments(filter),
    Wedding.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const userIds = [...new Set(docs.map((d) => String(d.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("name").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));

  res.json({
    weddings: docs.map((w) => ({
      ...w,
      userName: userMap.get(String(w.userId)) || "Unknown User",
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function listAdminUsers(req, res) {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
  const skip = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const status = normalizeStatus(req.query.status);

  const filter = { role: "user" };
  if (status !== null) filter.isActive = status;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const ids = users.map((u) => u._id);
  const weddingCounts = await Wedding.aggregate([
    { $match: { userId: { $in: ids } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const wcMap = new Map(weddingCounts.map((w) => [String(w._id), w.count]));

  res.json({
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      isActive: !!u.isActive,
      weddingsCreated: wcMap.get(String(u._id)) || 0,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function createAdminUser(req, res) {
  const nameCheck = validateName(req.body?.name);
  if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message });
  const emailCheck = validateEmail(req.body?.email);
  if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });

  const exists = await User.findOne({ email: emailCheck.value });
  if (exists) return res.status(409).json({ message: "User email already exists." });

  const tempPassword = `Temp@${Math.random().toString(36).slice(2, 10)}1`;
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const user = await User.create({
    name: nameCheck.value,
    email: emailCheck.value,
    passwordHash,
    role: "user",
    isVerified: true,
    isActive: true,
  });

  await createAdminNotification("User created", `Admin created user "${user.name}" (${user.email}).`);

  res.status(201).json({
    message: "User created successfully.",
    user: { id: user._id, name: user.name, email: user.email, isActive: true, weddingsCreated: 0 },
  });
}

export async function updateAdminUser(req, res) {
  const { id } = req.params;
  const existing = await User.findOne({ _id: id, role: "user" });
  if (!existing) return res.status(404).json({ message: "User not found." });

  const update = {};
  if (req.body?.name !== undefined) {
    const nameCheck = validateName(req.body.name);
    if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message });
    update.name = nameCheck.value;
  }
  if (req.body?.email !== undefined) {
    const emailCheck = validateEmail(req.body.email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });
    const dup = await User.findOne({ email: emailCheck.value, _id: { $ne: id } });
    if (dup) return res.status(409).json({ message: "Email already exists." });
    update.email = emailCheck.value;
  }
  if (req.body?.isActive !== undefined) {
    update.isActive = !!req.body.isActive;
  }

  existing.set(update);
  await existing.save();
  await createAdminNotification("User updated", `Admin updated user "${existing.name}".`);
  res.json({
    message: "User updated.",
    user: {
      id: existing._id,
      name: existing.name,
      email: existing.email,
      isActive: !!existing.isActive,
    },
  });
}

export async function deleteAdminUser(req, res) {
  const { id } = req.params;
  const user = await User.findOneAndDelete({ _id: id, role: "user" });
  if (!user) return res.status(404).json({ message: "User not found." });
  const weddings = await Wedding.find({ userId: user._id }).select("_id").lean();
  const weddingIds = weddings.map((w) => w._id);
  await Wedding.deleteMany({ userId: user._id });
  if (weddingIds.length) await Guest.deleteMany({ weddingId: { $in: weddingIds } });
  await createAdminNotification("User deleted", `Admin deleted user "${user.name}" and related data.`);
  res.json({ message: "User deleted." });
}

export async function listAdminNotifications(req, res) {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
  const skip = (page - 1) * limit;

  const [total, notifications] = await Promise.all([
    AdminNotification.countDocuments({}),
    AdminNotification.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    notifications,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function markAdminNotificationRead(req, res) {
  const n = await AdminNotification.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true } },
    { new: true }
  ).lean();
  if (!n) return res.status(404).json({ message: "Notification not found." });
  res.json({ message: "Notification marked as read.", notification: n });
}

export async function clearAdminNotifications(req, res) {
  await AdminNotification.deleteMany({});
  res.json({ message: "Notifications cleared." });
}
