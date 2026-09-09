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
    // ==========================================
    // BASIC COUNTS
    // ==========================================

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
    // Cancelled orders are excluded
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
            (totalRevenue / totalSales).toFixed(2)
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