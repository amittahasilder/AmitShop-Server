import express from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE ORDER
// POST /api/orders
// Login Required
// ==========================================

router.post(
  "/",
  protect,
  createOrder
);

// ==========================================
// GET MY ORDERS
// GET /api/orders/my-orders
// Login Required
// ==========================================

router.get(
  "/my-orders",
  protect,
  getMyOrders
);

// ==========================================
// ADMIN - GET ALL ORDERS
// GET /api/orders/admin/all
// Admin Required
// ==========================================

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllOrders
);

// ==========================================
// ADMIN - GET SINGLE ORDER
// GET /api/orders/admin/:orderId
// Admin Required
// ==========================================

router.get(
  "/admin/:orderId",
  protect,
  authorizeRoles("admin"),
  getAdminOrderById
);

// ==========================================
// ADMIN - UPDATE ORDER STATUS
// PUT /api/orders/admin/:orderId/status
// Admin Required
// ==========================================

router.put(
  "/admin/:orderId/status",
  protect,
  authorizeRoles("admin"),
  updateOrderStatus
);

// ==========================================
// ADMIN - DELETE ORDER
// DELETE /api/orders/admin/:orderId
// Admin Required
// ==========================================

router.delete(
  "/admin/:orderId",
  protect,
  authorizeRoles("admin"),
  deleteOrder
);

// ==========================================
// CANCEL MY ORDER
// PUT /api/orders/:orderId/cancel
// Login Required
// ==========================================

router.put(
  "/:orderId/cancel",
  protect,
  cancelOrder
);

// ==========================================
// GET SINGLE ORDER
// GET /api/orders/:orderId
// Login Required
// ==========================================

router.get(
  "/:orderId",
  protect,
  getOrderById
);

export default router;