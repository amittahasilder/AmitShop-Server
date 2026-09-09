import express from "express";

import {
  getAdminDashboard,

  // USER MANAGEMENT
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

  // PRODUCT MANAGEMENT
  getAllAdminProducts,
  getAdminProductById,
  updateAdminProductStatus,
} from "../controllers/adminController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

// Existing Product Controller
import {
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// ============================================================
// ADMIN PROTECTION
// ============================================================

router.use(protect);
router.use(authorizeRoles("admin"));

// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
  "/dashboard",
  getAdminDashboard
);

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

router.get(
  "/users",
  getAllUsers
);

router.get(
  "/users/:id",
  getUserById
);

router.put(
  "/users/:id",
  updateUser
);

router.delete(
  "/users/:id",
  deleteUser
);

// ============================================================
// ADMIN PRODUCT MANAGEMENT
// ============================================================

// Get all products
router.get(
  "/products",
  getAllAdminProducts
);

// Get single product
router.get(
  "/products/:id",
  getAdminProductById
);

// Activate / deactivate product
router.patch(
  "/products/:id/status",
  updateAdminProductStatus
);

// Update any product
router.put(
  "/products/:id",
  updateProduct
);

// Delete any product
router.delete(
  "/products/:id",
  deleteProduct
);

export default router;