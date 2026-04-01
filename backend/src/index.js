import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./server.js";
import { seedAdminUser } from "./services/seedAdminUser.js";

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI?.trim();

async function connectDatabase() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI. Copy backend/.env.example to backend/.env and set it.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

async function start() {
  try {
    await connectDatabase();
    await seedAdminUser();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
}

start();
