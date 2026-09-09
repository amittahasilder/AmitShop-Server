import mongoose from "mongoose";

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ==========================================
// ADMIN DASHBOARD OVERVIEW
// GET /api/admin/dashboard
// Admin Only
// ==========================================

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalSellers,
      totalAdmins,
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "customer",
      }),

      User.countDocuments({
        role: "seller",
      }),

      User.countDocuments({
        role: "admin",
      }),

      Product.countDocuments(),

      Product.countDocuments({
        isActive: true,
      }),

      Product.countDocuments({
        isActive: false,
      }),

      Order.countDocuments(),

      Order.countDocuments({
        orderStatus: "pending",
      }),

      Order.countDocuments({
        orderStatus: "confirmed",
      }),

      Order.countDocuments({
        orderStatus: "processing",
      }),

      Order.countDocuments({
        orderStatus: "shipped",
      }),

      Order.countDocuments({
        orderStatus: "delivered",
      }),

      Order.countDocuments({
        orderStatus: "cancelled",
      }),
    ]);

    // ==========================================
    // REVENUE
    // ==========================================

    const revenueResult = await Order.aggregate([
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

          totalRevenue: {
            $sum: "$totalPrice",
          },

          totalSales: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    const totalSales =
      revenueResult.length > 0
        ? revenueResult[0].totalSales
        : 0;

    // ==========================================
    // AVERAGE ORDER VALUE
    // ==========================================

    const averageOrderValue =
      totalSales > 0
        ? Number(
            (
              totalRevenue /
              totalSales
            ).toFixed(2)
          )
        : 0;

    // ==========================================
    // LOW STOCK
    // ==========================================

    const lowStockProducts =
      await Product.countDocuments({
        stock: {
          $gt: 0,
          $lte: 5,
        },
      });

    // ==========================================
    // OUT OF STOCK
    // ==========================================

    const outOfStockProducts =
      await Product.countDocuments({
        stock: 0,
      });

    // ==========================================
    // RECENT ORDERS
    // ==========================================

    const recentOrders =
      await Order.find()
        .populate(
          "user",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .select(
          "_id user totalPrice paymentStatus orderStatus createdAt"
        );

    // ==========================================
    // RECENT USERS
    // ==========================================

    const recentUsers =
      await User.find()
        .select(
          "_id name email role isActive createdAt"
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
          totalRevenue,
          averageOrderValue,
        },

        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    console.error(
      "Admin Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while loading admin dashboard",
    });
  }
};

// ==========================================
// GET ALL USERS
// GET /api/admin/users
// Admin Only
// ==========================================

export const getAllUsers = async (
  req,
  res
) => {
  try {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    // ==========================================
    // BUILD FILTER
    // ==========================================

    const filter = {};

    // ==========================================
    // SEARCH
    // ==========================================

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // ROLE FILTER
    // ==========================================

    if (
      role &&
      ["customer", "seller", "admin"].includes(
        role
      )
    ) {
      filter.role = role;
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================

    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const usersPerPage = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const skip =
      (currentPage - 1) *
      usersPerPage;

    // ==========================================
    // FETCH USERS
    // ==========================================

    const [users, totalUsers] =
      await Promise.all([
        User.find(filter)
          .select(
            "_id name email role avatar isActive createdAt updatedAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(usersPerPage),

        User.countDocuments(filter),
      ]);

    // ==========================================
    // PAGINATION
    // ==========================================

    const totalPages = Math.ceil(
      totalUsers / usersPerPage
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      users,

      pagination: {
        currentPage,
        usersPerPage,
        totalUsers,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
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

// ==========================================
// GET SINGLE USER
// GET /api/admin/users/:id
// Admin Only
// ==========================================

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

// ==========================================
// UPDATE USER
// PUT /api/admin/users/:id
// Admin Only
// ==========================================

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
      user.avatar = String(
        avatar
      ).trim();
    }

    // ==========================================
    // SAVE
    // ==========================================

    await user.save();

    // ==========================================
    // RESPONSE
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

// ==========================================
// DELETE USER
// DELETE /api/admin/users/:id
// Admin Only
// ==========================================

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
      message: "User deleted successfully",
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