import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// ==========================================
// ADD TO WISHLIST
// POST /api/wishlist
// Login Required
// ==========================================

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // FIND USER WISHLIST
    // ==========================================

    let wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    // ==========================================
    // CREATE WISHLIST IF NOT EXISTS
    // ==========================================

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [
          {
            product: product._id,
          },
        ],
      });

      await wishlist.populate("items.product");

      return res.status(201).json({
        success: true,
        message: "Product added to wishlist successfully",
        wishlist,
      });
    }

    // ==========================================
    // CHECK DUPLICATE PRODUCT
    // ==========================================

    const alreadyExists = wishlist.items.some(
      (item) =>
        item.product.toString() === product._id.toString()
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Product is already in wishlist",
      });
    }

    // ==========================================
    // ADD PRODUCT
    // ==========================================

    wishlist.items.push({
      product: product._id,
    });

    // ==========================================
    // SAVE WISHLIST
    // ==========================================

    await wishlist.save();

    await wishlist.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Add To Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while adding product to wishlist",
    });
  }
};

// ==========================================
// GET MY WISHLIST
// GET /api/wishlist
// Login Required
// ==========================================

export const getMyWishlist = async (req, res) => {
  try {
    // ==========================================
    // FIND USER WISHLIST
    // ==========================================

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    }).populate("items.product");

    // ==========================================
    // WISHLIST NOT FOUND
    // ==========================================

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        wishlist: {
          user: req.user._id,
          items: [],
        },
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      totalItems: wishlist.items.length,
      wishlist,
    });
  } catch (error) {
    console.error("Get My Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching wishlist",
    });
  }
};

// ==========================================
// REMOVE FROM WISHLIST
// DELETE /api/wishlist/:productId
// Login Required
// ==========================================

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND USER WISHLIST
    // ==========================================

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    // ==========================================
    // CHECK PRODUCT
    // ==========================================

    const itemExists = wishlist.items.some(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // ==========================================
    // REMOVE PRODUCT
    // ==========================================

    wishlist.items = wishlist.items.filter(
      (item) =>
        item.product.toString() !== productId.toString()
    );

    // ==========================================
    // SAVE WISHLIST
    // ==========================================

    await wishlist.save();

    await wishlist.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Remove From Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while removing product from wishlist",
    });
  }
};

// ==========================================
// CLEAR WISHLIST
// DELETE /api/wishlist
// Login Required
// ==========================================

export const clearWishlist = async (req, res) => {
  try {
    // ==========================================
    // FIND USER WISHLIST
    // ==========================================

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    // ==========================================
    // WISHLIST DOES NOT EXIST
    // ==========================================

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is already empty",
        wishlist: {
          user: req.user._id,
          items: [],
        },
      });
    }

    // ==========================================
    // CLEAR ALL ITEMS
    // ==========================================

    wishlist.items = [];

    // ==========================================
    // SAVE
    // ==========================================

    await wishlist.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while clearing wishlist",
    });
  }
};