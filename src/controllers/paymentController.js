import mongoose from "mongoose";

import stripe from "../config/stripe.js";
import Order from "../models/Order.js";

// ==========================================
// HELPER: VALIDATE OBJECT ID
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// CREATE STRIPE CHECKOUT SESSION
// POST /api/payments/create-checkout-session
// Login Required
// ==========================================

export const createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CHECK ORDER OWNER
    // ==========================================

    if (
      order.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to pay for this order",
      });
    }

    // ==========================================
    // CHECK PAYMENT METHOD
    // ==========================================

    if (order.paymentMethod !== "STRIPE") {
      return res.status(400).json({
        success: false,
        message:
          "This order is not configured for Stripe payment",
      });
    }

    // ==========================================
    // CHECK ORDER STATUS
    // ==========================================

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled orders cannot be paid",
      });
    }

    // ==========================================
    // CHECK PAYMENT STATUS
    // ==========================================

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    // ==========================================
    // CREATE STRIPE LINE ITEMS
    // ==========================================

    const lineItems = order.items.map((item) => {
      const unitAmount = Math.round(
        Number(item.price) * 100
      );

      return {
        price_data: {
          currency: "usd",

          product_data: {
            name: item.name,

            ...(item.image
              ? {
                  images: [item.image],
                }
              : {}),
          },

          unit_amount: unitAmount,
        },

        quantity: item.quantity,
      };
    });

    // ==========================================
    // ADD SHIPPING
    // ==========================================

    if (order.shippingPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Shipping",
          },

          unit_amount: Math.round(
            Number(order.shippingPrice) * 100
          ),
        },

        quantity: 1,
      });
    }

    // ==========================================
    // ADD TAX
    // ==========================================

    if (order.taxPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Tax",
          },

          unit_amount: Math.round(
            Number(order.taxPrice) * 100
          ),
        },

        quantity: 1,
      });
    }

    // ==========================================
    // CREATE STRIPE CHECKOUT SESSION
    // ==========================================

    const clientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        line_items: lineItems,

        success_url:
          `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,

        cancel_url:
          `${clientUrl}/payment/cancel?orderId=${order._id}`,

        customer_email:
          req.user.email,

        metadata: {
          orderId: order._id.toString(),

          userId: req.user._id.toString(),
        },

        billing_address_collection: "auto",
      });

    // ==========================================
    // SAVE STRIPE SESSION ID
    // ==========================================

    order.paymentId = session.id;

    await order.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Stripe checkout session created successfully",

      sessionId: session.id,

      url: session.url,

      orderId: order._id,
    });
  } catch (error) {
    console.error(
      "Create Stripe Checkout Session Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Something went wrong while creating Stripe checkout session",
    });
  }
};

// ==========================================
// GET STRIPE CHECKOUT SESSION
// GET /api/payments/session/:sessionId
// Login Required
// ==========================================

export const getCheckoutSession = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Stripe session ID is required",
      });
    }

    // ==========================================
    // RETRIEVE SESSION
    // ==========================================

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId
      );

    // ==========================================
    // SECURITY CHECK
    // ==========================================

    if (
      session.metadata?.userId !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this payment session",
      });
    }

    return res.status(200).json({
      success: true,

      session: {
        id: session.id,

        status: session.status,

        paymentStatus:
          session.payment_status,

        amountTotal:
          session.amount_total,

        currency:
          session.currency,

        orderId:
          session.metadata?.orderId || null,
      },
    });
  } catch (error) {
    console.error(
      "Get Stripe Checkout Session Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Something went wrong while fetching Stripe session",
    });
  }
};

// ==========================================
// STRIPE WEBHOOK
// POST /api/payments/webhook
// Stripe Only
// ==========================================

export const stripeWebhook = async (req, res) => {
  const signature =
    req.headers["stripe-signature"];

  // ==========================================
  // CHECK SIGNATURE
  // ==========================================

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: "Stripe signature is missing",
    });
  }

  let event;

  // ==========================================
  // VERIFY STRIPE WEBHOOK
  // ==========================================

  try {
    event =
      stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
  } catch (error) {
    console.error(
      "Stripe Webhook Signature Error:",
      error.message
    );

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
  }

  // ==========================================
  // PROCESS EVENT
  // ==========================================

  try {
    // ==========================================
    // CHECKOUT COMPLETED
    // ==========================================

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session = event.data.object;

      const orderId =
        session.metadata?.orderId;

      // ==========================================
      // CHECK ORDER ID
      // ==========================================

      if (!orderId) {
        console.error(
          "Stripe Webhook: Order ID missing from metadata"
        );

        return res.status(400).json({
          success: false,
          message:
            "Order ID missing from Stripe metadata",
        });
      }

      // ==========================================
      // FIND ORDER
      // ==========================================

      const order =
        await Order.findById(orderId);

      if (!order) {
        console.error(
          `Stripe Webhook: Order not found: ${orderId}`
        );

        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // ==========================================
      // PAYMENT SUCCESS
      // ==========================================

      if (
        session.payment_status === "paid"
      ) {
        // Prevent duplicate webhook processing
        if (
          order.paymentStatus !== "paid"
        ) {
          order.paymentStatus = "paid";

          order.paymentId =
            session.payment_intent?.toString() ||
            session.id;

          order.paidAt = new Date();

          // ==========================================
          // CONFIRM ORDER
          // ==========================================

          if (
            order.orderStatus === "pending"
          ) {
            order.orderStatus =
              "confirmed";

            order.statusHistory.push({
              status: "confirmed",

              note:
                "Payment received and order confirmed",

              updatedBy: null,

              createdAt: new Date(),
            });
          }

          await order.save();

          console.log(
            `✅ Stripe payment successful for order: ${order._id}`
          );
        } else {
          console.log(
            `ℹ️ Stripe webhook already processed for order: ${order._id}`
          );
        }
      }
    }

    // ==========================================
    // ASYNC PAYMENT FAILED
    // ==========================================

    if (
      event.type ===
      "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object;

      const orderId =
        session.metadata?.orderId;

      if (orderId) {
        const order =
          await Order.findById(orderId);

        if (
          order &&
          order.paymentStatus !== "paid"
        ) {
          order.paymentStatus =
            "failed";

          await order.save();

          console.log(
            `❌ Stripe payment failed for order: ${order._id}`
          );
        }
      }
    }

    // ==========================================
    // CHECKOUT SESSION EXPIRED
    // ==========================================

    if (
      event.type ===
      "checkout.session.expired"
    ) {
      const session = event.data.object;

      const orderId =
        session.metadata?.orderId;

      if (orderId) {
        const order =
          await Order.findById(orderId);

        if (
          order &&
          order.paymentStatus !== "paid"
        ) {
          order.paymentStatus =
            "failed";

          await order.save();

          console.log(
            `⚠️ Stripe checkout expired for order: ${order._id}`
          );
        }
      }
    }

    // ==========================================
    // STRIPE RESPONSE
    // ==========================================

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe Webhook Processing Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while processing Stripe webhook",
    });
  }
};