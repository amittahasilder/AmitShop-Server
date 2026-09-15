import express from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get current user profile
router.get("/profile", protect, getProfile);

// Update current user profile
router.put("/profile", protect, updateProfile);

// Change password
router.put("/change-password", protect, changePassword);

export default router;