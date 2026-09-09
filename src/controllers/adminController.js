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
          totalSaleOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalSales =
      salesResult.length > 0
        ? Number(salesResult[0].totalSales || 0)
        : 0;

    const totalSaleOrders =
      salesResult.length > 0
        ? salesResult[0].totalSaleOrders || 0
        : 0;

    const averageOrderValue =
      totalSaleOrders > 0
        ? Number(
            (totalSales / totalSaleOrders).toFixed(2)
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
      .populate(
        "items.product",
        "_id name slug price images"
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

    const query = {};

    // ==========================================
    // SEARCH
    // ==========================================

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

    // ==========================================
    // ROLE FILTER
    // ==========================================

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

    // ==========================================
    // STATUS FILTER
    // ==========================================

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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // PREVENT SELF DEACTIVATION
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
    // PREVENT SELF ROLE CHANGE
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
    // NAME
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
    // ROLE
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
    // ACTIVE STATUS
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
    // AVATAR
    // ==========================================

    if (avatar !== undefined) {
      user.avatar =
        String(avatar).trim();
    }

    // ==========================================
    // SAVE
    // ==========================================

    await user.save();

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

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

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

    const query = {};

    // ==========================================
    // SEARCH
    // ==========================================

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

    // ==========================================
    // CATEGORY
    // ==========================================

    if (category) {
      query.category = category;
    }

    // ==========================================
    // BRAND
    // ==========================================

    if (brand) {
      query.brand = brand;
    }

    // ==========================================
    // STATUS
    // ==========================================

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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

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

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      const product =
        await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      product.isActive = isActive;

      await product.save();

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

// ============================================================
// GET ALL ADMIN ORDERS
// GET /api/admin/orders
// Admin Only
// ============================================================

export const getAllAdminOrders = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status,
      paymentStatus,
      paymentMethod,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const query = {};

    // ==========================================
    // SEARCH USER / PAYMENT ID
    // ==========================================

    if (search.trim()) {
      const searchValue =
        search.trim();

      const users =
        await User.find({
          $or: [
            {
              name: {
                $regex: searchValue,
                $options: "i",
              },
            },
            {
              email: {
                $regex: searchValue,
                $options: "i",
              },
            },
          ],
        }).select("_id");

      const userIds = users.map(
        (user) => user._id
      );

      const orConditions = [];

      if (userIds.length > 0) {
        orConditions.push({
          user: {
            $in: userIds,
          },
        });
      }

      orConditions.push({
        paymentId: {
          $regex: searchValue,
          $options: "i",
        },
      });

      // Search by ObjectId if valid
      if (
        mongoose.Types.ObjectId.isValid(
          searchValue
        )
      ) {
        orConditions.push({
          _id: searchValue,
        });
      }

      query.$or = orConditions;
    }

    // ==========================================
    // ORDER STATUS
    // ==========================================

    if (status) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (
        allowedStatuses.includes(status)
      ) {
        query.orderStatus = status;
      }
    }

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    if (paymentStatus) {
      const allowedPaymentStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded",
      ];

      if (
        allowedPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        query.paymentStatus =
          paymentStatus;
      }
    }

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    if (paymentMethod) {
      const allowedPaymentMethods = [
        "COD",
        "STRIPE",
      ];

      if (
        allowedPaymentMethods.includes(
          paymentMethod
        )
      ) {
        query.paymentMethod =
          paymentMethod;
      }
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
      await Order.countDocuments(query);

    // ==========================================
    // ORDERS
    // ==========================================

    const orders = await Order.find(query)
      .populate(
        "user",
        "_id name email"
      )
      .populate(
        "items.product",
        "_id name slug price images seller"
      )
      .sort(sort)
      .skip(skip)
      .limit(perPage);

    return res.status(200).json({
      success: true,

      orders,

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
      "Get All Admin Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching admin orders",
    });
  }
};

// ============================================================
// GET SINGLE ADMIN ORDER
// GET /api/admin/orders/:id
// Admin Only
// ============================================================

export const getAdminOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id)
        .populate(
          "user",
          "_id name email"
        )
        .populate(
          "items.product",
          "_id name slug price images seller"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get Admin Order By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching order",
    });
  }
};

// ============================================================
// UPDATE ADMIN ORDER STATUS
// PATCH /api/admin/orders/:id/status
// Admin Only
// ============================================================

export const updateAdminOrderStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // VALID STATUS
    // ==========================================

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // PREVENT REOPEN CANCELLED ORDER
    // ==========================================

    if (
      order.orderStatus === "cancelled" &&
      status !== "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled order cannot be reopened",
      });
    }

    // ==========================================
    // STATUS HISTORY
    // ==========================================

    if (
      !Array.isArray(
        order.statusHistory
      )
    ) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status,
      note:
        note?.trim() ||
        `Order status changed to ${status}`,
      changedAt: new Date(),
    });

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    order.orderStatus = status;

    // ==========================================
    // DELIVERED
    // ==========================================

    if (status === "delivered") {
      order.deliveredAt =
        order.deliveredAt ||
        new Date();
    }

    // ==========================================
    // CANCELLED
    // ==========================================

    if (status === "cancelled") {
      order.cancelledAt =
        order.cancelledAt ||
        new Date();
    }

    await order.save();

    // ==========================================
    // POPULATE
    // ==========================================

    await order.populate([
      {
        path: "user",
        select: "_id name email",
      },
      {
        path: "items.product",
        select:
          "_id name slug price images seller",
      },
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update Admin Order Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating order status",
    });
  }
};

// ============================================================
// UPDATE ADMIN PAYMENT STATUS
// PATCH /api/admin/orders/:id/payment-status
// Admin Only
// ============================================================

export const updateAdminPaymentStatus =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      const allowedStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded",
      ];

      if (
        !allowedStatuses.includes(
          paymentStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment status",
        });
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.paymentStatus =
        paymentStatus;

      if (paymentStatus === "paid") {
        order.paidAt =
          order.paidAt ||
          new Date();
      }

      await order.save();

      await order.populate([
        {
          path: "user",
          select: "_id name email",
        },
        {
          path: "items.product",
          select:
            "_id name slug price images seller",
        },
      ]);

      return res.status(200).json({
        success: true,
        message:
          "Payment status updated successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Update Admin Payment Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while updating payment status",
      });
    }
  };

// ============================================================
// DELETE ADMIN ORDER
// DELETE /api/admin/orders/:id
// Admin Only
// ============================================================

export const deleteAdminOrder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Order deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Admin Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting order",
    });
  }
};

// ============================================================
// ADMIN SALES & ANALYTICS
// GET /api/admin/analytics
// Admin Only
// ============================================================

export const getAdminAnalytics = async (
  req,
  res
) => {
  try {
    const {
      period = 30,
    } = req.query;

    // ==========================================
    // VALIDATE PERIOD
    // ==========================================

    const allowedPeriods = [
      7,
      30,
      90,
      180,
      365,
    ];

    const selectedPeriod =
      Number(period);

    if (
      !allowedPeriods.includes(
        selectedPeriod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Allowed periods: 7, 30, 90, 180, 365",
      });
    }

    // ==========================================
    // DATE RANGE
    // ==========================================

    const startDate = new Date();

    startDate.setDate(
      startDate.getDate() -
        selectedPeriod
    );

    // ==========================================
    // COMMON MATCH
    // ==========================================

    const match = {
      createdAt: {
        $gte: startDate,
      },
      orderStatus: {
        $ne: "cancelled",
      },
      paymentStatus: {
        $nin: [
          "failed",
          "refunded",
        ],
      },
    };

    // ==========================================
    // SUMMARY
    // ==========================================

    const summaryResult =
      await Order.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$totalPrice",
            },

            totalOrders: {
              $sum: 1,
            },

            averageOrderValue: {
              $avg: "$totalPrice",
            },
          },
        },
      ]);

    const summary =
      summaryResult.length > 0
        ? summaryResult[0]
        : {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
          };

    // ==========================================
    // DAILY SALES
    // ==========================================

    const dailySales =
      await Order.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            revenue: {
              $sum: "$totalPrice",
            },

            orders: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // ==========================================
    // PAYMENT METHOD BREAKDOWN
    // ==========================================

    const paymentMethods =
      await Order.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: "$paymentMethod",

            totalOrders: {
              $sum: 1,
            },

            totalRevenue: {
              $sum: "$totalPrice",
            },
          },
        },
        {
          $sort: {
            totalRevenue: -1,
          },
        },
      ]);

    // ==========================================
    // ORDER STATUS BREAKDOWN
    // ==========================================

    const orderStatuses =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
            },
          },
        },
        {
          $group: {
            _id: "$orderStatus",

            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]);

    // ==========================================
    // TOP PRODUCTS
    // ==========================================

    const topProducts =
      await Order.aggregate([
        {
          $match: match,
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.product",

            quantitySold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $sort: {
            revenue: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            quantitySold: 1,
            revenue: 1,

            product: {
              _id: "$product._id",
              name: "$product.name",
              slug: "$product.slug",
              images: "$product.images",
              price: "$product.price",
            },
          },
        },
      ]);

    // ==========================================
    // TOP SELLERS
    // ==========================================

    const topSellers =
      await Order.aggregate([
        {
          $match: match,
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "products",
            localField:
              "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: "$product",
        },
        {
          $group: {
            _id: "$product.seller",

            quantitySold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },
        {
          $sort: {
            revenue: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            quantitySold: 1,
            revenue: 1,

            seller: {
              _id: "$seller._id",
              name: "$seller.name",
              email: "$seller.email",
            },
          },
        },
      ]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      period: selectedPeriod,

      dateRange: {
        startDate,
        endDate: new Date(),
      },

      summary: {
        totalRevenue: Number(
          summary.totalRevenue || 0
        ),

        totalOrders:
          summary.totalOrders || 0,

        averageOrderValue: Number(
          summary.averageOrderValue || 0
        ),
      },

      dailySales,

      paymentMethods,

      orderStatuses,

      topProducts,

      topSellers,
    });
  } catch (error) {
    console.error(
      "Get Admin Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching admin analytics",
    });
  }
};