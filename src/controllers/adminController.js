import mongoose from "mongoose";

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ============================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// Admin Only
// ============================================================

export const getAdminDashboard = async (req, res) => {
  try {
    // ==========================================
    // USER COUNTS
    // ==========================================

    const totalUsers = await User.countDocuments();

    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const totalSellers = await User.countDocuments({
      role: "seller",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const activeUsers = await User.countDocuments({
      isActive: true,
    });

    const inactiveUsers = await User.countDocuments({
      isActive: false,
    });

    // ==========================================
    // PRODUCT COUNTS
    // ==========================================

    const totalProducts = await Product.countDocuments();

    const activeProducts = await Product.countDocuments({
      isActive: true,
    });

    const inactiveProducts = await Product.countDocuments({
      isActive: false,
    });

    const lowStockProducts = await Product.countDocuments({
      stock: {
        $gt: 0,
        $lte: 5,
      },
      isActive: true,
    });

    const outOfStockProducts = await Product.countDocuments({
      stock: 0,
    });

    // ==========================================
    // ORDER COUNTS
    // ==========================================

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });

    const confirmedOrders = await Order.countDocuments({
      orderStatus: "confirmed",
    });

    const processingOrders = await Order.countDocuments({
      orderStatus: "processing",
    });

    const shippedOrders = await Order.countDocuments({
      orderStatus: "shipped",
    });

    const deliveredOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      orderStatus: "cancelled",
    });

    // ==========================================
    // SALES / REVENUE
    // ==========================================

    const salesResult = await Order.aggregate([
      {
        $match: {
          orderStatus: {
            $ne: "cancelled",
          },
          paymentStatus: {
            $nin: ["failed", "refunded"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$totalPrice",
          },
        },
      },
    ]);

    const totalSales =
      salesResult.length > 0
        ? salesResult[0].totalSales
        : 0;

    const averageOrderValue =
      totalOrders > 0
        ? Number(
            (totalSales / totalOrders).toFixed(2)
          )
        : 0;

    // ==========================================
    // RECENT ORDERS
    // ==========================================

    const recentOrders = await Order.find()
      .populate(
        "user",
        "_id name email"
      )
      .sort({
        createdAt: -1,
      })
      .limit(10);

    // ==========================================
    // RECENT USERS
    // ==========================================

    const recentUsers = await User.find()
      .select(
        "_id name email role avatar isActive createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(10);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      dashboard: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          sellers: totalSellers,
          admins: totalAdmins,
          active: activeUsers,
          inactive: inactiveUsers,
        },

        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },

        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },

        sales: {
          totalSales,
          averageOrderValue,
        },

        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching admin dashboard",
    });
  }
};

// ============================================================
// GET ALL USERS
// GET /api/admin/users
// Admin Only
// ============================================================

export const getAllUsers = async (req, res) => {
  try {
    const {
      search = "",
      role,
      status,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    // ==========================================
    // QUERY
    // ==========================================

    const query = {};

    // Search by name/email
    if (search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Role filter
    if (role) {
      const allowedRoles = [
        "customer",
        "seller",
        "admin",
      ];

      if (allowedRoles.includes(role)) {
        query.role = role;
      }
    }

    // Status filter
    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (currentPage - 1) * perPage;

    // ==========================================
    // TOTAL
    // ==========================================

    const total =
      await User.countDocuments(query);

    // ==========================================
    // USERS
    // ==========================================

    const users = await User.find(query)
      .select(
        "_id name email role avatar isActive createdAt updatedAt"
      )
      .sort(sort)
      .skip(skip)
      .limit(perPage);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      users,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(
          total / perPage
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get All Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching users",
    });
  }
};

// ============================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// Admin Only
// ============================================================

export const getUserById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user =
      await User.findById(id).select(
        "_id name email role avatar isActive createdAt updatedAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get User By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching user",
    });
  }
};

// ============================================================
// UPDATE USER
// PUT /api/admin/users/:id
// Admin Only
// ============================================================

export const updateUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      role,
      isActive,
      avatar,
    } = req.body;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // PREVENT ADMIN SELF-DEACTIVATION
    // ==========================================

    if (
      id === req.user._id.toString() &&
      isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot deactivate your own admin account",
      });
    }

    // ==========================================
    // PREVENT ADMIN SELF ROLE CHANGE
    // ==========================================

    if (
      id === req.user._id.toString() &&
      role !== undefined &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own admin role",
      });
    }

    // ==========================================
    // UPDATE NAME
    // ==========================================

    if (name !== undefined) {
      const trimmedName =
        String(name).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be at least 2 characters",
        });
      }

      if (trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot exceed 50 characters",
        });
      }

      user.name = trimmedName;
    }

    // ==========================================
    // UPDATE ROLE
    // ==========================================

    if (role !== undefined) {
      const allowedRoles = [
        "customer",
        "seller",
        "admin",
      ];

      if (
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role. Allowed roles: customer, seller, admin",
        });
      }

      user.role = role;
    }

    // ==========================================
    // UPDATE ACTIVE STATUS
    // ==========================================

    if (isActive !== undefined) {
      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      user.isActive = isActive;
    }

    // ==========================================
    // UPDATE AVATAR
    // ==========================================

    if (avatar !== undefined) {
      user.avatar =
        String(avatar).trim();
    }

    // ==========================================
    // SAVE
    // ==========================================

    await user.save();

    // ==========================================
    // SAFE USER
    // ==========================================

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "User updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating user",
    });
  }
};

// ============================================================
// DELETE USER
// DELETE /api/admin/users/:id
// Admin Only
// ============================================================

export const deleteUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // PREVENT SELF DELETE
    // ==========================================

    if (
      id === req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own admin account",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // DELETE USER
    // ==========================================

    await User.findByIdAndDelete(id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting user",
    });
  }
};

// ============================================================
// GET ALL PRODUCTS FOR ADMIN
// GET /api/admin/products
// Admin Only
// ============================================================

export const getAllAdminProducts = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      category,
      brand,
      status,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    // ==========================================
    // QUERY
    // ==========================================

    const query = {};

    // Search
    if (search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category) {
      query.category = category;
    }

    // Brand
    if (brand) {
      query.brand = brand;
    }

    // Active / inactive
    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (currentPage - 1) * perPage;

    // ==========================================
    // TOTAL
    // ==========================================

    const total =
      await Product.countDocuments(query);

    // ==========================================
    // PRODUCTS
    // ==========================================

    const products =
      await Product.find(query)
        .populate(
          "seller",
          "_id name email role"
        )
        .sort(sort)
        .skip(skip)
        .limit(perPage);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      products,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(
          total / perPage
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get All Admin Products Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching products",
    });
  }
};

// ============================================================
// GET SINGLE PRODUCT FOR ADMIN
// GET /api/admin/products/:id
// Admin Only
// ============================================================

export const getAdminProductById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product =
      await Product.findById(id).populate(
        "seller",
        "_id name email role"
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get Admin Product By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching product",
    });
  }
};

// ============================================================
// UPDATE PRODUCT ACTIVE STATUS
// PATCH /api/admin/products/:id/status
// Admin Only
// ============================================================

export const updateAdminProductStatus =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // ==========================================
      // VALIDATE ID
      // ==========================================

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      // ==========================================
      // VALIDATE STATUS
      // ==========================================

      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      // ==========================================
      // FIND PRODUCT
      // ==========================================

      const product =
        await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // ==========================================
      // UPDATE
      // ==========================================

      product.isActive = isActive;

      await product.save();

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.status(200).json({
        success: true,
        message: isActive
          ? "Product activated successfully"
          : "Product deactivated successfully",
        product,
      });
    } catch (error) {
      console.error(
        "Update Admin Product Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while updating product status",
      });
    }
  };