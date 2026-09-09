import express from "express";

import {
  getSellerDashboard,
  getSellerProducts,
  getSellerLowStockProducts,
  getSellerOrders,
  getSellerAnalytics,
} from "../controllers/sellerController.js";

import { protect } from "../middleware/authMiddleware.js";

import {
  sellerOnly,
} from "../middleware/sellerMiddleware.js";

const router = express.Router();

// ==========================================
// ALL SELLER ROUTES
// ==========================================

router.use(protect);
router.use(sellerOnly);

// ==========================================
// SELLER DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  getSellerDashboard
);

// ==========================================
// SELLER PRODUCTS
// ==========================================

router.get(
  "/products",
  getSellerProducts
);

// ==========================================
// LOW STOCK PRODUCTS
// ==========================================

router.get(
  "/products/low-stock",
  getSellerLowStockProducts
);

// ==========================================
// SELLER ORDERS
// ==========================================

router.get(
  "/orders",
  getSellerOrders
);

// ==========================================
// SELLER ANALYTICS
// ==========================================

router.get(
  "/analytics",
  getSellerAnalytics
);

export default router;