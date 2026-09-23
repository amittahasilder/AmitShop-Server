import express from "express";

import {
  createCheckoutSession,
  getCheckoutSession,
  verifyStripePayment,
  stripeWebhook,
} from "../controllers/paymentController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// STRIPE WEBHOOK
// IMPORTANT:
// Webhook MUST receive RAW BODY
// ==========================================

router.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  stripeWebhook
);

// ==========================================
// CREATE CHECKOUT SESSION
// POST /api/payments/create-checkout-session
// Login Required
// ==========================================

router.post(
  "/create-checkout-session",
  protect,
  createCheckoutSession
);

// ==========================================
// GET CHECKOUT SESSION
// GET /api/payments/session/:sessionId
// Login Required
// ==========================================

router.get(
  "/session/:sessionId",
  protect,
  getCheckoutSession
);

// ==========================================
// VERIFY STRIPE PAYMENT
// GET /api/payments/verify/:sessionId
// Login Required
// ==========================================

router.get(
  "/verify/:sessionId",
  protect,
  verifyStripePayment
);

export default router;