import mongoose from "mongoose";
import Product from "../models/Product.js";

// ======================================================
// HELPER: CHECK PRODUCT ACCESS
// ======================================================

const checkProductAccess = (product, user) => {
  if (!product) {
    return {
      allowed: false,
      message: "Product not found",
    };
  }

  // Admin can manage every product
  if (user.role === "admin") {
    return {
      allowed: true,
    };
  }

  // Seller can manage only own products
  if (
    user.role === "seller" &&
    product.seller?.toString() === user._id.toString()
  ) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    message: "You are not allowed to manage this product stock",
  };
};

// ======================================================
// 16.2 UPDATE STOCK
// PUT /api/inventory/:productId
// ======================================================

export const updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate stock
    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: "Stock is required",
      });
    }

    if (!Number.isInteger(Number(stock))) {
      return res.status(400).json({
        success: false,
        message: "Stock must be an integer",
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check seller/admin access
    const access = checkProductAccess(product, req.user);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    // Update stock
    product.stock = Number(stock);

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isOutOfStock: product.stock === 0,
      },
    });
  } catch (error) {
    console.error("Update Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
};

// ======================================================
// 16.3 INCREASE STOCK
// PATCH /api/inventory/:productId/increase
// ======================================================

export const increaseStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    if (!Number.isInteger(Number(quantity))) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check access
    const access = checkProductAccess(product, req.user);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    // Increase stock atomically
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          stock: Number(quantity),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Stock increased successfully",
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        isOutOfStock: updatedProduct.stock === 0,
      },
    });
  } catch (error) {
    console.error("Increase Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to increase stock",
      error: error.message,
    });
  }
};

// ======================================================
// 16.4 DECREASE STOCK
// PATCH /api/inventory/:productId/decrease
// ======================================================

export const decreaseStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    if (!Number.isInteger(Number(quantity))) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check access
    const access = checkProductAccess(product, req.user);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    // Atomic decrease
    // IMPORTANT:
    // stock cannot go below zero
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: {
          $gte: Number(quantity),
        },
      },
      {
        $inc: {
          stock: -Number(quantity),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Not enough stock
    if (!updatedProduct) {
      const latestProduct = await Product.findById(productId);

      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        availableStock: latestProduct?.stock ?? 0,
        requestedQuantity: Number(quantity),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock decreased successfully",
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        isOutOfStock: updatedProduct.stock === 0,
      },
    });
  } catch (error) {
    console.error("Decrease Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to decrease stock",
      error: error.message,
    });
  }
};

// ======================================================
// 16.5 OUT-OF-STOCK PRODUCTS
// GET /api/inventory/out-of-stock
// ======================================================

export const getOutOfStockProducts = async (req, res) => {
  try {
    let filter = {
      stock: 0,
    };

    // Seller can see only own products
    if (req.user.role === "seller") {
      filter.seller = req.user._id;
    }

    const products = await Product.find(filter)
      .select("name slug price stock category brand images seller isActive")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Out Of Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get out-of-stock products",
      error: error.message,
    });
  }
};

// ======================================================
// 16.6 LOW-STOCK PRODUCTS
// GET /api/inventory/low-stock?threshold=5
// ======================================================

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold =
      req.query.threshold !== undefined
        ? Number(req.query.threshold)
        : 5;

    // Validate threshold
    if (!Number.isInteger(threshold) || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Threshold must be a non-negative integer",
      });
    }

    let filter = {
      stock: {
        $lte: threshold,
      },
    };

    // Seller can see only own products
    if (req.user.role === "seller") {
      filter.seller = req.user._id;
    }

    const products = await Product.find(filter)
      .select("name slug price stock category brand images seller isActive")
      .sort({ stock: 1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      threshold,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Low Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get low-stock products",
      error: error.message,
    });
  }
};

// ======================================================
// GET INVENTORY SUMMARY
// GET /api/inventory/summary
// ======================================================

export const getInventorySummary = async (req, res) => {
  try {
    let filter = {};

    // Seller only own products
    if (req.user.role === "seller") {
      filter.seller = req.user._id;
    }

    const [totalProducts, outOfStock, lowStock, stockResult] =
      await Promise.all([
        Product.countDocuments(filter),

        Product.countDocuments({
          ...filter,
          stock: 0,
        }),

        Product.countDocuments({
          ...filter,
          stock: {
            $gt: 0,
            $lte: 5,
          },
        }),

        Product.aggregate([
          {
            $match: filter,
          },
          {
            $group: {
              _id: null,
              totalStock: {
                $sum: "$stock",
              },
            },
          },
        ]),
      ]);

    const totalStock = stockResult[0]?.totalStock || 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        totalStock,
        outOfStock,
        lowStock,
        inStock: totalProducts - outOfStock,
      },
    });
  } catch (error) {
    console.error("Inventory Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get inventory summary",
      error: error.message,
    });
  }
};