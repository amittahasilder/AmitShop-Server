import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ==========================================
// ADD TO CART
// POST /api/cart
// Login Required
// ==========================================

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

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

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
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
    // CHECK STOCK
    // ==========================================

    if (product.stock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    // ==========================================
    // FIND USER CART
    // ==========================================

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    // ==========================================
    // CREATE CART IF NOT EXISTS
    // ==========================================

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [
          {
            product: product._id,
            quantity: requestedQuantity,
          },
        ],
      });

      await cart.populate("items.product");

      return res.status(201).json({
        success: true,
        message: "Product added to cart successfully",
        cart,
      });
    }

    // ==========================================
    // CHECK EXISTING PRODUCT
    // ==========================================

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product._id.toString()
    );

    // ==========================================
    // UPDATE EXISTING ITEM
    // ==========================================

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + requestedQuantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) available in stock`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      // ==========================================
      // ADD NEW ITEM
      // ==========================================

      cart.items.push({
        product: product._id,
        quantity: requestedQuantity,
      });
    }

    // ==========================================
    // SAVE CART
    // ==========================================

    await cart.save();

    await cart.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while adding product to cart",
    });
  }
};

// ==========================================
// GET MY CART
// GET /api/cart
// Login Required
// ==========================================

export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    // ==========================================
    // CART NOT FOUND / EMPTY
    // ==========================================

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: {
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
      cart,
    });
  } catch (error) {
    console.error("Get My Cart Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching cart",
    });
  }
};

// ==========================================
// UPDATE CART ITEM
// PUT /api/cart/:productId
// Login Required
// ==========================================

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    const newQuantity = Number(quantity);

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
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
    // CHECK STOCK
    // ==========================================

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    // ==========================================
    // FIND USER CART
    // ==========================================

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // ==========================================
    // FIND CART ITEM
    // ==========================================

    const cartItem = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // ==========================================
    // UPDATE QUANTITY
    // ==========================================

    cartItem.quantity = newQuantity;

    // ==========================================
    // SAVE
    // ==========================================

    await cart.save();

    await cart.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating cart item",
    });
  }
};

// ==========================================
// REMOVE CART ITEM
// DELETE /api/cart/:productId
// Login Required
// ==========================================

export const removeCartItem = async (req, res) => {
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
    // FIND USER CART
    // ==========================================

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // ==========================================
    // CHECK ITEM
    // ==========================================

    const itemExists = cart.items.some(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // ==========================================
    // REMOVE ITEM
    // ==========================================

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId.toString()
    );

    // ==========================================
    // SAVE
    // ==========================================

    await cart.save();

    await cart.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while removing cart item",
    });
  }
};

// ==========================================
// CLEAR CART
// DELETE /api/cart
// Login Required
// ==========================================

export const clearCart = async (req, res) => {
  try {
    // ==========================================
    // FIND USER CART
    // ==========================================

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    // ==========================================
    // CART DOES NOT EXIST
    // ==========================================

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
        cart: {
          user: req.user._id,
          items: [],
        },
      });
    }

    // ==========================================
    // CLEAR ITEMS
    // ==========================================

    cart.items = [];

    // ==========================================
    // SAVE
    // ==========================================

    await cart.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while clearing cart",
    });
  }
};