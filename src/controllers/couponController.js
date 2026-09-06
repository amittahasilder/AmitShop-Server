import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";

// ======================================================
// HELPER — Validate Coupon
// ======================================================

const validateCoupon = async (code, userId, subtotal) => {
  if (!code) {
    return {
      valid: false,
      message: "Coupon code is required",
    };
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!coupon) {
    return {
      valid: false,
      message: "Invalid coupon code",
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      message: "This coupon is inactive",
    };
  }

  const now = new Date();

  if (now < coupon.startDate) {
    return {
      valid: false,
      message: "This coupon is not active yet",
    };
  }

  if (now > coupon.endDate) {
    return {
      valid: false,
      message: "This coupon has expired",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      message: "This coupon usage limit has been reached",
    };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is ${coupon.minOrderAmount}`,
    };
  }

  const userUsage = coupon.usedBy.find(
    (item) => item.user.toString() === userId.toString()
  );

  if (
    userUsage &&
    userUsage.count >= coupon.perUserLimit
  ) {
    return {
      valid: false,
      message: "You have already reached the usage limit for this coupon",
    };
  }

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount =
      (subtotal * coupon.discountValue) / 100;

    if (
      coupon.maxDiscountAmount !== null &&
      discountAmount > coupon.maxDiscountAmount
    ) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  discountAmount = Number(discountAmount.toFixed(2));

  const finalAmount = Number(
    (subtotal - discountAmount).toFixed(2)
  );

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount,
  };
};

// ======================================================
// CREATE COUPON
// POST /api/coupons
// Admin only
// ======================================================

export const createCoupon = async (req, res) => {
  try {
    let {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      isActive,
    } = req.body;

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!discountType) {
      return res.status(400).json({
        success: false,
        message: "Discount type is required",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be percentage or fixed",
      });
    }

    discountValue = Number(discountValue);

    if (Number.isNaN(discountValue) || discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100",
      });
    }

    minOrderAmount =
      minOrderAmount === undefined ||
      minOrderAmount === ""
        ? 0
        : Number(minOrderAmount);

    if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid minimum order amount",
      });
    }

    if (
      maxDiscountAmount !== undefined &&
      maxDiscountAmount !== "" &&
      maxDiscountAmount !== null
    ) {
      maxDiscountAmount = Number(maxDiscountAmount);

      if (
        Number.isNaN(maxDiscountAmount) ||
        maxDiscountAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum discount amount",
        });
      }
    } else {
      maxDiscountAmount = null;
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: "End date is required",
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    usageLimit =
      usageLimit === undefined ||
      usageLimit === "" ||
      usageLimit === null
        ? null
        : Number(usageLimit);

    if (
      usageLimit !== null &&
      (Number.isNaN(usageLimit) || usageLimit < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Usage limit must be at least 1",
      });
    }

    perUserLimit =
      perUserLimit === undefined ||
      perUserLimit === ""
        ? 1
        : Number(perUserLimit);

    if (
      Number.isNaN(perUserLimit) ||
      perUserLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Per user limit must be at least 1",
      });
    }

    // -----------------------------
    // Check duplicate coupon
    // -----------------------------

    const existingCoupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // -----------------------------
    // Create coupon
    // -----------------------------

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate: start,
      endDate: end,
      usageLimit,
      perUserLimit,
      isActive:
        isActive === undefined
          ? true
          : Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL COUPONS
// GET /api/coupons
// Admin only
// ======================================================

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("usedBy.user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get Coupons Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE COUPON
// GET /api/coupons/:id
// Admin only
// ======================================================

export const getSingleCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(id).populate(
      "usedBy.user",
      "name email"
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Get Single Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE COUPON
// PUT /api/coupons/:id
// Admin only
// ======================================================

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const allowedFields = [
      "code",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscountAmount",
      "startDate",
      "endDate",
      "usageLimit",
      "perUserLimit",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    }

    if (coupon.code) {
      coupon.code = coupon.code.trim().toUpperCase();
    }

    if (
      !["percentage", "fixed"].includes(
        coupon.discountType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be percentage or fixed",
      });
    }

    coupon.discountValue = Number(coupon.discountValue);

    if (
      Number.isNaN(coupon.discountValue) ||
      coupon.discountValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      coupon.discountType === "percentage" &&
      coupon.discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100",
      });
    }

    coupon.minOrderAmount = Number(
      coupon.minOrderAmount || 0
    );

    if (coupon.maxDiscountAmount !== null) {
      coupon.maxDiscountAmount = Number(
        coupon.maxDiscountAmount
      );
    }

    coupon.startDate = new Date(coupon.startDate);
    coupon.endDate = new Date(coupon.endDate);

    if (
      Number.isNaN(coupon.startDate.getTime()) ||
      Number.isNaN(coupon.endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon dates",
      });
    }

    if (coupon.endDate <= coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (coupon.usageLimit !== null) {
      coupon.usageLimit = Number(coupon.usageLimit);

      if (
        Number.isNaN(coupon.usageLimit) ||
        coupon.usageLimit < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid usage limit",
        });
      }
    }

    coupon.perUserLimit = Number(
      coupon.perUserLimit || 1
    );

    if (coupon.perUserLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid per user limit",
      });
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE COUPON
// DELETE /api/coupons/:id
// Admin only
// ======================================================

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await Coupon.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

// ======================================================
// APPLY COUPON
// POST /api/coupons/apply
// Logged-in user
// ======================================================

export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code } = req.body;

    // -----------------------------------------
    // Get user's cart
    // -----------------------------------------

    const cart = await Cart.findOne({
      user: userId,
    }).populate("items.product");

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // -----------------------------------------
    // Calculate subtotal
    // -----------------------------------------

    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.product) {
        continue;
      }

      const productPrice =
        item.product.discountPrice !== null &&
        item.product.discountPrice !== undefined
          ? item.product.discountPrice
          : item.product.price;

      subtotal += Number(productPrice) * Number(item.quantity);
    }

    subtotal = Number(subtotal.toFixed(2));

    // -----------------------------------------
    // Validate coupon
    // -----------------------------------------

    const result = await validateCoupon(
      code,
      userId,
      subtotal
    );

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        id: result.coupon._id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      pricing: {
        subtotal,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    console.error("Apply Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: error.message,
    });
  }
};