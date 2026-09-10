import express from "express";

import {
  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  getAdminDashboard,

  // ============================================================
  // USER MANAGEMENT
  // ============================================================
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

  // ============================================================
  // PRODUCT MANAGEMENT
  // ============================================================
  getAllAdminProducts,
  getAdminProductById,
  updateAdminProductStatus,

  // ============================================================
  // ORDER MANAGEMENT
  // ============================================================
  getAllAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
  deleteAdminOrder,

  // ============================================================
  // SALES & ANALYTICS
  // ============================================================
  getAdminAnalytics,
} from "../controllers/adminController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

// ============================================================
// EXISTING PRODUCT CONTROLLER
// Admin can update/delete any product
// ============================================================

import {
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// ============================================================
// ADMIN PROTECTION
// ============================================================

router.use(protect);

router.use(
  authorizeRoles("admin")
);

// ============================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// ============================================================

router.get(
  "/dashboard",
  getAdminDashboard
);

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

// Get all users
// GET /api/admin/users

router.get(
  "/users",
  getAllUsers
);

// Get single user
// GET /api/admin/users/:id

router.get(
  "/users/:id",
  getUserById
);

// Update user
// PUT /api/admin/users/:id

router.put(
  "/users/:id",
  updateUser
);

// Delete user
// DELETE /api/admin/users/:id

router.delete(
  "/users/:id",
  deleteUser
);

// ============================================================
// ADMIN PRODUCT MANAGEMENT
// ============================================================

// Get all products
// GET /api/admin/products

router.get(
  "/products",
  getAllAdminProducts
);

// Get single product
// GET /api/admin/products/:id

router.get(
  "/products/:id",
  getAdminProductById
);

// Activate / deactivate product
// PATCH /api/admin/products/:id/status

router.patch(
  "/products/:id/status",
  updateAdminProductStatus
);

// Update any product
// PUT /api/admin/products/:id

router.put(
  "/products/:id",
  updateProduct
);

// Delete any product
// DELETE /api/admin/products/:id

router.delete(
  "/products/:id",
  deleteProduct
);

// ============================================================
// ADMIN ORDER MANAGEMENT
// ============================================================

// Get all orders
// GET /api/admin/orders

router.get(
  "/orders",
  getAllAdminOrders
);

// Get single order
// GET /api/admin/orders/:id

router.get(
  "/orders/:id",
  getAdminOrderById
);

// Update order status
// PATCH /api/admin/orders/:id/status

router.patch(
  "/orders/:id/status",
  updateAdminOrderStatus
);

// Update payment status
// PATCH /api/admin/orders/:id/payment-status

router.patch(
  "/orders/:id/payment-status",
  updateAdminPaymentStatus
);

// Delete order
// DELETE /api/admin/orders/:id

router.delete(
  "/orders/:id",
  deleteAdminOrder
);

// ============================================================
// ADMIN SALES & ANALYTICS
// GET /api/admin/analytics
// ============================================================

router.get(
  "/analytics",
  getAdminAnalytics
);

// ============================================================
// EXPORT
// ============================================================

export default router;