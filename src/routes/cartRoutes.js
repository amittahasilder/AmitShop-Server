import express from "express";

import {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CART ROUTES
// ==========================================

// ==========================================
// ADD PRODUCT TO CART
// POST /api/cart
// Login Required
// ==========================================

router.post(
  "/",
  protect,
  addToCart
);

// ==========================================
// GET MY CART
// GET /api/cart
// Login Required
// ==========================================

router.get(
  "/",
  protect,
  getMyCart
);

// ==========================================
// CLEAR CART
// DELETE /api/cart
// Login Required
// ==========================================

router.delete(
  "/",
  protect,
  clearCart
);

// ==========================================
// UPDATE CART ITEM
// PUT /api/cart/:productId
// Login Required
// ==========================================

router.put(
  "/:productId",
  protect,
  updateCartItem
);

// ==========================================
// REMOVE CART ITEM
// DELETE /api/cart/:productId
// Login Required
// ==========================================

router.delete(
  "/:productId",
  protect,
  removeCartItem
);

export default router;