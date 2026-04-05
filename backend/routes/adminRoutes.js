import express from "express";
import { getStats, createReport, resolveReport } from "../controllers/adminController.js";

const router = express.Router();

// GET /api/admin/stats
router.get("/stats", getStats);

// POST /api/admin/reports
router.post("/reports", createReport);

// PATCH /api/admin/reports/:id/resolve
router.patch("/reports/:id/resolve", resolveReport);

export default router;
