import express from "express";

import {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN AUTHORIZATION
// ==========================================

router.use(protect);

router.use(
  authorizeRoles("admin")
);

// ==========================================
// DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  getAdminDashboard
);

// ==========================================
// USER MANAGEMENT
// ==========================================

// GET ALL USERS
router.get(
  "/users",
  getAllUsers
);

// GET SINGLE USER
router.get(
  "/users/:id",
  getUserById
);

// UPDATE USER
router.put(
  "/users/:id",
  updateUser
);

// DELETE USER
router.delete(
  "/users/:id",
  deleteUser
);

export default router;