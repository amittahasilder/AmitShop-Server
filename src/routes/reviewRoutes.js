import express from "express";

import {
  addReview,
  getProductReviews,
  getMyReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// REVIEW ROUTES
// ==========================================

// ==========================================
// ADD REVIEW
// POST /api/reviews
// Login Required
// ==========================================

router.post(
  "/",
  protect,
  addReview
);

// ==========================================
// GET PRODUCT REVIEWS
// GET /api/reviews/product/:productId
// Public
// ==========================================

router.get(
  "/product/:productId",
  getProductReviews
);

// ==========================================
// GET MY REVIEW
// GET /api/reviews/my/:productId
// Login Required
// ==========================================

router.get(
  "/my/:productId",
  protect,
  getMyReview
);

// ==========================================
// UPDATE OWN REVIEW
// PUT /api/reviews/:reviewId
// Login Required
// ==========================================

router.put(
  "/:reviewId",
  protect,
  updateReview
);

// ==========================================
// DELETE OWN REVIEW
// DELETE /api/reviews/:reviewId
// Login Required
// ==========================================

router.delete(
  "/:reviewId",
  protect,
  deleteReview
);

export default router;