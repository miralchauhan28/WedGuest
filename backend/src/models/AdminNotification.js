import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("AdminNotification", adminNotificationSchema);
