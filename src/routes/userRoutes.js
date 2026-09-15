import express from "express";
import multer from "multer";

import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// MULTER CONFIG
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ==========================================
// PROFILE
// ==========================================

// Get current profile
router.get("/profile", protect, getProfile);

// Update profile information
router.put("/profile", protect, updateProfile);

// Change password
router.put("/change-password", protect, changePassword);

// Upload profile avatar
router.post(
  "/profile/avatar",
  protect,
  upload.single("avatar"),
  uploadAvatar
);

export default router;