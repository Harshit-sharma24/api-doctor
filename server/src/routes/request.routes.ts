import { Router } from "express";

import {
  testRequest,
  getHistory,
  deleteHistoryItem,
  clearHistory,
} from "../controllers/request.controller.js";

const router = Router();

// Test API request
router.post("/test-request", testRequest);

// Request history
router.get("/history", getHistory);

// Delete one history item
router.delete("/history/:id", deleteHistoryItem);

// Delete all history
router.delete("/history", clearHistory);

export default router;