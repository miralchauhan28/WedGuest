export const MEAL_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Gluten-free", "Standard", "Other"];
export const RSVP_OPTIONS = ["Pending", "Accepted", "Declined"];
export const ATTENDEE_OPTIONS = ["Yes", "No"];

export function normalizeRsvp(v) {
  const s = String(v || "").trim();
  if (s.toLowerCase() === "accepted") return "Accepted";
  if (s.toLowerCase() === "declined") return "Declined";
  if (s.toLowerCase() === "pending") return "Pending";
  return RSVP_OPTIONS.includes(s) ? s : null;
}

export function normalizeAttendee(v) {
  const s = String(v || "").trim();
  if (s.toLowerCase() === "yes") return "Yes";
  if (s.toLowerCase() === "no") return "No";
  return ATTENDEE_OPTIONS.includes(s) ? s : null;
}
