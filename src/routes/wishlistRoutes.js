import express from "express";

import {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// WISHLIST ROUTES
// ==========================================

// ==========================================
// ADD PRODUCT TO WISHLIST
// POST /api/wishlist
// Login Required
// ==========================================

router.post(
  "/",
  protect,
  addToWishlist
);

// ==========================================
// GET MY WISHLIST
// GET /api/wishlist
// Login Required
// ==========================================

router.get(
  "/",
  protect,
  getMyWishlist
);

// ==========================================
// CLEAR WISHLIST
// DELETE /api/wishlist
// Login Required
// ==========================================

router.delete(
  "/",
  protect,
  clearWishlist
);

// ==========================================
// REMOVE PRODUCT FROM WISHLIST
// DELETE /api/wishlist/:productId
// Login Required
// ==========================================

router.delete(
  "/:productId",
  protect,
  removeFromWishlist
);

export default router;