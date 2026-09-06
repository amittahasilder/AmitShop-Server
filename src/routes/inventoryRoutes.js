import express from "express";

import {
  updateStock,
  increaseStock,
  decreaseStock,
  getOutOfStockProducts,
  getLowStockProducts,
  getInventorySummary,
} from "../controllers/inventoryController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// INVENTORY SUMMARY
// GET /api/inventory/summary
// ======================================================

router.get(
  "/summary",
  protect,
  authorizeRoles("seller", "admin"),
  getInventorySummary
);

// ======================================================
// OUT OF STOCK
// GET /api/inventory/out-of-stock
// ======================================================

router.get(
  "/out-of-stock",
  protect,
  authorizeRoles("seller", "admin"),
  getOutOfStockProducts
);

// ======================================================
// LOW STOCK
// GET /api/inventory/low-stock?threshold=5
// ======================================================

router.get(
  "/low-stock",
  protect,
  authorizeRoles("seller", "admin"),
  getLowStockProducts
);

// ======================================================
// UPDATE STOCK
// PUT /api/inventory/:productId
// ======================================================

router.put(
  "/:productId",
  protect,
  authorizeRoles("seller", "admin"),
  updateStock
);

// ======================================================
// INCREASE STOCK
// PATCH /api/inventory/:productId/increase
// ======================================================

router.patch(
  "/:productId/increase",
  protect,
  authorizeRoles("seller", "admin"),
  increaseStock
);

// ======================================================
// DECREASE STOCK
// PATCH /api/inventory/:productId/decrease
// ======================================================

router.patch(
  "/:productId/decrease",
  protect,
  authorizeRoles("seller", "admin"),
  decreaseStock
);

export default router;