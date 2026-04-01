import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    attendee: { type: String, enum: ["Yes", "No"], required: true },
    mealPreference: { type: String, trim: true, maxlength: 80, default: "" },
    rsvpStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      required: true,
      default: "Pending",
    },
    invitationTokenHash: { type: String, index: true },
    invitationTokenExpiresAt: { type: Date },
    invitationRespondedAt: { type: Date },
  },
  { timestamps: true }
);

guestSchema.index({ weddingId: 1, email: 1 }, { unique: true });

export default mongoose.model("Guest", guestSchema);
