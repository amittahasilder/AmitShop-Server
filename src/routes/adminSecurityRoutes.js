import express from "express";

import {
  changeAdminPassword,
} from "../controllers/adminSecurityController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================================================
// CHANGE ADMIN PASSWORD
// PUT /api/admin/security/password
// =========================================================

router.put(
  "/password",
  protect,
  authorizeRoles("admin"),
  changeAdminPassword
);

export default router;