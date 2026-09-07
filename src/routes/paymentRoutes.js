import express from "express";

import {
  createCheckoutSession,
  getCheckoutSession,
} from "../controllers/paymentController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE STRIPE CHECKOUT SESSION
// POST /api/payments/create-checkout-session
// Login Required
// ==========================================

router.post(
  "/create-checkout-session",
  protect,
  createCheckoutSession
);

// ==========================================
// GET STRIPE CHECKOUT SESSION
// GET /api/payments/session/:sessionId
// Login Required
// ==========================================

router.get(
  "/session/:sessionId",
  protect,
  getCheckoutSession
);

export default router;