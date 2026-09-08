import express from "express";

import {
  createCheckoutSession,
  getCheckoutSession,
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

export default router;