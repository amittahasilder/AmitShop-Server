import express from "express";

import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CATEGORY ROUTES
// ==========================================

// ==========================================
// GET ALL CATEGORIES
// Public
// ==========================================

router.get("/", getAllCategories);

// ==========================================
// GET SINGLE CATEGORY
// Public
// ==========================================

router.get("/:id", getSingleCategory);

// ==========================================
// CREATE CATEGORY
// Admin only
// ==========================================

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCategory
);

// ==========================================
// UPDATE CATEGORY
// Admin only
// ==========================================

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateCategory
);

// ==========================================
// DELETE CATEGORY
// Admin only
// ==========================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteCategory
);

export default router;