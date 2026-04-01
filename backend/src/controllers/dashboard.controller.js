import Guest from "../models/Guest.js";
import Wedding from "../models/Wedding.js";

export async function getUserDashboard(req, res) {
  const weddingDocs = await Wedding.find({ userId: req.userId }).sort({ weddingDate: 1 }).lean();
  const weddingIds = weddingDocs.map((w) => w._id);

  const weddingsCount = weddingIds.length;
  let totalGuests = 0;
  let accepted = 0;
  let pending = 0;
  let declined = 0;

  if (weddingIds.length > 0) {
    const filter = { weddingId: { $in: weddingIds } };
    [totalGuests, accepted, pending, declined] = await Promise.all([
      Guest.countDocuments(filter),
      Guest.countDocuments({ ...filter, rsvpStatus: "Accepted" }),
      Guest.countDocuments({ ...filter, rsvpStatus: "Pending" }),
      Guest.countDocuments({ ...filter, rsvpStatus: "Declined" }),
    ]);
  }

  const rsvpPct = totalGuests ? Math.round((accepted / totalGuests) * 100) : 0;

  const upcomingWeddings = weddingDocs.map((w) => ({
    ...w,
    daysUntil: Math.ceil((new Date(w.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  }));

  res.json({
    stats: {
      weddingsCount,
      totalGuests,
      accepted,
      pending,
      declined,
      rsvpPct,
    },
    attendanceBreakdown: { confirmed: accepted, pending, declined },
    upcomingWeddings,
  });
}
