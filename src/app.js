import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ==========================================
// ERROR MIDDLEWARE IMPORT
// ==========================================

import { errorHandler } from "./middleware/errorMiddleware.js";

// ==========================================
// ROUTES IMPORT
// ==========================================

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// ==========================================
// PAYMENT ROUTES
// IMPORTANT:
// Stripe webhook must come BEFORE express.json()
// ==========================================

app.use("/api/payments", paymentRoutes);

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// PRODUCT ROUTES
// ==========================================

app.use("/api/products", productRoutes);

// ==========================================
// CATEGORY ROUTES
// ==========================================

app.use("/api/categories", categoryRoutes);

// ==========================================
// CART ROUTES
// ==========================================

app.use("/api/cart", cartRoutes);

// ==========================================
// WISHLIST ROUTES
// ==========================================

app.use("/api/wishlist", wishlistRoutes);

// ==========================================
// REVIEW ROUTES
// ==========================================

app.use("/api/reviews", reviewRoutes);

// ==========================================
// ORDER ROUTES
// ==========================================

app.use("/api/orders", orderRoutes);

// ==========================================
// INVENTORY ROUTES
// ==========================================

app.use("/api/inventory", inventoryRoutes);

// ==========================================
// COUPON ROUTES
// ==========================================

app.use("/api/coupons", couponRoutes);

// ==========================================
// SELLER ROUTES
// ==========================================

app.use("/api/seller", sellerRoutes);

// ==========================================
// ADMIN ROUTES
// ==========================================

app.use("/api/admin", adminRoutes);

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AmitShop API is running 🚀",
  });
});

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// IMPORTANT:
// Must be AFTER all routes and 404 handler
// ==========================================

app.use(errorHandler);

// ==========================================
// EXPORT APP
// ==========================================

export default app;