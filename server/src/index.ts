import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database.js";
import requestRoutes from "./routes/request.routes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "API Doctor server is running!",
  });
});

// API routes
app.use("/api", requestRoutes);

// Start server
async function startServer() {
  await connectDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();