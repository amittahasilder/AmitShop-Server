import express from "express";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// AUTH ROUTES
// ==========================================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Refresh Access Token
router.post("/refresh", refreshAccessToken);

// Logout
router.post("/logout", logoutUser);

// Get Current User
router.get("/me", protect, getCurrentUser);

export default router;