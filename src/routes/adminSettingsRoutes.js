import express from "express";

import {
  getAdminSettings,
  updateAdminSettings,
} from "../controllers/adminSettingsController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// GET ADMIN SETTINGS
// GET /api/admin/settings
// ==========================================

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAdminSettings
);

// ==========================================
// UPDATE ADMIN SETTINGS
// PUT /api/admin/settings
// ==========================================

router.put(
  "/",
  protect,
  authorizeRoles("admin"),
  updateAdminSettings
);

export default router;