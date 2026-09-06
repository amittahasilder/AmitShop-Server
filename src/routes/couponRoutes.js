import express from "express";

import {
  createCoupon,
  getAllCoupons,
  getSingleCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// ADMIN COUPON MANAGEMENT
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createCoupon
);

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllCoupons
);

router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getSingleCoupon
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateCoupon
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteCoupon
);

// ======================================================
// USER APPLY COUPON
// ======================================================

router.post(
  "/apply",
  protect,
  applyCoupon
);

export default router;