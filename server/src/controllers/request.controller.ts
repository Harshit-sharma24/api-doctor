import { Request, Response } from "express";
import { RequestHistory } from "../models/requestHistory.model.js";
import { executeRequest } from "../services/request.service.js";

export async function testRequest(req: Request, res: Response) {
  try {
    const result = await executeRequest(req.body);

    res.json({
      success: true,
      result,
    });
 } catch (error) {
  console.error("API request failed:", error);

  res.status(500).json({
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Failed to execute API request",
  });
}
}

export async function getHistory(_req: Request, res: Response) {
  try {
    const history = await RequestHistory.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Failed to fetch history:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch request history",
    });
  }
}

export async function deleteHistoryItem(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const deletedItem = await RequestHistory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "History item not found",
      });
    }

    res.json({
      success: true,
      message: "History item deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete history item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete history item",
    });
  }
}

export async function clearHistory(
  _req: Request,
  res: Response
) {
  try {
    await RequestHistory.deleteMany({});

    res.json({
      success: true,
      message: "Request history cleared successfully",
    });
  } catch (error) {
    console.error("Failed to clear history:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear request history",
    });
  }
}