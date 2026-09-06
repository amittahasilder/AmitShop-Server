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

import { protect } from "../middleware/authMiddleware.js";

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
// ==========================================

router.get(
  "/admin/all",
  protect,
  getAllOrders
);

// ==========================================
// ADMIN - GET SINGLE ORDER
// GET /api/orders/admin/:orderId
// ==========================================

router.get(
  "/admin/:orderId",
  protect,
  getAdminOrderById
);

// ==========================================
// ADMIN - UPDATE ORDER STATUS
// PUT /api/orders/admin/:orderId/status
// ==========================================

router.put(
  "/admin/:orderId/status",
  protect,
  updateOrderStatus
);

// ==========================================
// ADMIN - DELETE ORDER
// DELETE /api/orders/admin/:orderId
// ==========================================

router.delete(
  "/admin/:orderId",
  protect,
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