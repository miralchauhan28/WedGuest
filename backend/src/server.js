import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import guestPublicRoutes from "./routes/guest-public.routes.js";
import weddingRoutes from "./routes/wedding.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const labels = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    ok: true,
    mongodb: labels[dbState] ?? "unknown",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/guest-rsvp", guestPublicRoutes);
app.use("/api/weddings", weddingRoutes);
app.use("/api/user", userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export { app };
