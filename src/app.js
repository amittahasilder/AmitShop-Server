import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
// PAYMENT ROUTES
// ==========================================

app.use("/api/payments", paymentRoutes);

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
// EXPORT APP
// ==========================================

export default app;