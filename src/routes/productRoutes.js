import express from "express";

import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================================
// PRODUCT ROUTES
// ==========================================

// ==========================================
// GET ALL PRODUCTS
// Public
// ==========================================

router.get("/", getAllProducts);

// ==========================================
// GET SINGLE PRODUCT
// Public
// ==========================================

router.get("/:id", getSingleProduct);

// ==========================================
// CREATE PRODUCT
// Seller + Admin only
// Cloudinary image upload
// ==========================================

router.post(
  "/",
  protect,
  authorizeRoles("seller", "admin"),
  upload.array("images", 10),
  createProduct
);

// ==========================================
// UPDATE PRODUCT
// Seller + Admin only
// Cloudinary image upload
// ==========================================

router.put(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  upload.array("images", 10),
  updateProduct
);

// ==========================================
// DELETE PRODUCT
// Seller + Admin only
// ==========================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  deleteProduct
);

export default router;