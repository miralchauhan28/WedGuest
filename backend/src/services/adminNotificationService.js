import AdminNotification from "../models/AdminNotification.js";

export async function createAdminNotification(title, message) {
  if (!title || !message) return null;
  return AdminNotification.create({ title: String(title), message: String(message) });
}
