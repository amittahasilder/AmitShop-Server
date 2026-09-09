import mongoose from "mongoose";

import Product from "../models/Product.js";
import Order from "../models/Order.js";

// ==========================================
// HELPER: VALIDATE OBJECT ID
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// HELPER: GET SELLER PRODUCT IDS
// ==========================================

const getSellerProductIds = async (sellerId) => {
  const products = await Product.find({
    seller: sellerId,
  }).select("_id");

  return products.map((product) => product._id);
};

// ==========================================
// SELLER DASHBOARD OVERVIEW
// GET /api/seller/dashboard
// Seller Required
// ==========================================

export const getSellerDashboard = async (
  req,
  res
) => {
  try {
    const sellerId = req.user._id;

    // ==========================================
    // GET SELLER PRODUCTS
    // ==========================================

    const products = await Product.find({
      seller: sellerId,
    }).select(
      "_id name price discountPrice stock ratings numReviews isActive createdAt"
    );

    const productIds = products.map(
      (product) => product._id
    );

    // ==========================================
    // NO PRODUCTS
    // ==========================================

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        dashboard: {
          totalProducts: 0,
          activeProducts: 0,
          inactiveProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
        },
      });
    }

    // ==========================================
    // PRODUCT STATS
    // ==========================================

    const totalProducts = products.length;

    const activeProducts = products.filter(
      (product) => product.isActive
    ).length;

    const inactiveProducts =
      totalProducts - activeProducts;

    const lowStockProducts = products.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 5
    ).length;

    const outOfStockProducts = products.filter(
      (product) => product.stock === 0
    ).length;

    // ==========================================
    // GET ORDERS CONTAINING SELLER PRODUCTS
    // ==========================================

    const orders = await Order.find({
      "items.product": {
        $in: productIds,
      },
    }).select(
      "items orderStatus paymentStatus totalPrice createdAt"
    );

    // ==========================================
    // SELLER ORDER STATS
    // ==========================================

    let totalOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    let totalRevenue = 0;

    // ==========================================
    // CALCULATE SELLER REVENUE
    // ==========================================

    for (const order of orders) {
      const sellerItems = order.items.filter(
        (item) =>
          item.product &&
          productIds.some(
            (productId) =>
              productId.toString() ===
              item.product.toString()
          )
      );

      if (sellerItems.length === 0) {
        continue;
      }

      totalOrders++;

      // ========================================
      // ORDER STATUS
      // ========================================

      switch (order.orderStatus) {
        case "pending":
          pendingOrders++;
          break;

        case "processing":
          processingOrders++;
          break;

        case "shipped":
          shippedOrders++;
          break;

        case "delivered":
          deliveredOrders++;
          break;

        case "cancelled":
          cancelledOrders++;
          break;

        default:
          break;
      }

      // ========================================
      // REVENUE
      // ========================================

      if (
        order.orderStatus !== "cancelled" &&
        order.paymentStatus !== "failed" &&
        order.paymentStatus !== "refunded"
      ) {
        const sellerOrderRevenue =
          sellerItems.reduce(
            (total, item) =>
              total +
              Number(item.price) *
                Number(item.quantity),
            0
          );

        totalRevenue += sellerOrderRevenue;
      }
    }

    totalRevenue = Number(
      totalRevenue.toFixed(2)
    );

    const averageOrderValue =
      totalOrders > 0
        ? Number(
            (
              totalRevenue /
              totalOrders
            ).toFixed(2)
          )
        : 0;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      dashboard: {
        totalProducts,
        activeProducts,
        inactiveProducts,

        lowStockProducts,
        outOfStockProducts,

        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,

        totalRevenue,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error(
      "Get Seller Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching seller dashboard",
    });
  }
};

// ==========================================
// SELLER PRODUCTS
// GET /api/seller/products
// Seller Required
// ==========================================

export const getSellerProducts = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // ==========================================
    // BUILD QUERY
    // ==========================================

    const query = {
      seller: req.user._id,
    };

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
          category: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // GET PRODUCTS
    // ==========================================

    const [products, total] =
      await Promise.all([
        Product.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        Product.countDocuments(query),
      ]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      count: products.length,

      total,

      page: pageNumber,

      pages: Math.ceil(
        total / limitNumber
      ),

      products,
    });
  } catch (error) {
    console.error(
      "Get Seller Products Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching seller products",
    });
  }
};

// ==========================================
// SELLER LOW STOCK PRODUCTS
// GET /api/seller/products/low-stock
// Seller Required
// ==========================================

export const getSellerLowStockProducts =
  async (req, res) => {
    try {
      const products =
        await Product.find({
          seller: req.user._id,
          stock: {
            $lte: 5,
          },
        })
          .sort({
            stock: 1,
          })
          .select(
            "_id name price stock images isActive"
          );

      return res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      console.error(
        "Get Seller Low Stock Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while fetching low stock products",
      });
    }
  };

// ==========================================
// SELLER ORDERS
// GET /api/seller/orders
// Seller Required
// ==========================================

export const getSellerOrders = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // ==========================================
    // GET SELLER PRODUCT IDS
    // ==========================================

    const productIds =
      await getSellerProductIds(
        req.user._id
      );

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: pageNumber,
        pages: 0,
        orders: [],
      });
    }

    // ==========================================
    // BUILD ORDER QUERY
    // ==========================================

    const query = {
      "items.product": {
        $in: productIds,
      },
    };

    if (status.trim()) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status",
        });
      }

      query.orderStatus = status;
    }

    // ==========================================
    // GET TOTAL
    // ==========================================

    const total =
      await Order.countDocuments(query);

    // ==========================================
    // GET ORDERS
    // ==========================================

    const orders =
      await Order.find(query)
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.product",
          "name images price seller"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber);

    // ==========================================
    // RETURN ONLY SELLER ITEMS
    // ==========================================

    const sellerOrders =
      orders.map((order) => {
        const sellerItems =
          order.items.filter(
            (item) =>
              item.product &&
              item.product.seller &&
              item.product.seller.toString() ===
                req.user._id.toString()
          );

        const sellerItemsPrice =
          sellerItems.reduce(
            (total, item) =>
              total +
              Number(item.price) *
                Number(item.quantity),
            0
          );

        return {
          _id: order._id,

          user: order.user,

          shippingAddress:
            order.shippingAddress,

          paymentMethod:
            order.paymentMethod,

          paymentStatus:
            order.paymentStatus,

          orderStatus:
            order.orderStatus,

          statusHistory:
            order.statusHistory,

          sellerItems,

          sellerItemsPrice:
            Number(
              sellerItemsPrice.toFixed(2)
            ),

          createdAt:
            order.createdAt,

          updatedAt:
            order.updatedAt,
        };
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      count: sellerOrders.length,

      total,

      page: pageNumber,

      pages: Math.ceil(
        total / limitNumber
      ),

      orders: sellerOrders,
    });
  } catch (error) {
    console.error(
      "Get Seller Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching seller orders",
    });
  }
};

// ==========================================
// SELLER ANALYTICS
// GET /api/seller/analytics
// Seller Required
// ==========================================

export const getSellerAnalytics = async (
  req,
  res
) => {
  try {
    const {
      period = "30",
    } = req.query;

    const periodNumber = Number(period);

    if (
      !Number.isInteger(periodNumber) ||
      periodNumber < 1 ||
      periodNumber > 365
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Period must be between 1 and 365 days",
      });
    }

    // ==========================================
    // DATE RANGE
    // ==========================================

    const startDate =
      new Date();

    startDate.setDate(
      startDate.getDate() -
        periodNumber
    );

    // ==========================================
    // GET SELLER PRODUCTS
    // ==========================================

    const productIds =
      await getSellerProductIds(
        req.user._id
      );

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,

        analytics: {
          period: periodNumber,
          totalOrders: 0,
          totalItemsSold: 0,
          totalRevenue: 0,
          dailySales: [],
          topProducts: [],
        },
      });
    }

    // ==========================================
    // GET ORDERS
    // ==========================================

    const orders =
      await Order.find({
        "items.product": {
          $in: productIds,
        },

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
      }).select(
        "items orderStatus paymentStatus createdAt"
      );

    // ==========================================
    // ANALYTICS VARIABLES
    // ==========================================

    let totalOrders = 0;
    let totalItemsSold = 0;
    let totalRevenue = 0;

    const dailySalesMap =
      new Map();

    const topProductsMap =
      new Map();

    // ==========================================
    // PROCESS ORDERS
    // ==========================================

    for (const order of orders) {
      const sellerItems =
        order.items.filter(
          (item) =>
            item.product &&
            productIds.some(
              (productId) =>
                productId.toString() ===
                item.product.toString()
            )
        );

      if (
        sellerItems.length === 0
      ) {
        continue;
      }

      totalOrders++;

      // ========================================
      // PROCESS ITEMS
      // ========================================

      for (const item of sellerItems) {
        const itemRevenue =
          Number(item.price) *
          Number(item.quantity);

        totalItemsSold +=
          Number(item.quantity);

        totalRevenue +=
          itemRevenue;

        // ======================================
        // DAILY SALES
        // ======================================

        const dateKey =
          new Date(
            order.createdAt
          )
            .toISOString()
            .split("T")[0];

        if (
          !dailySalesMap.has(
            dateKey
          )
        ) {
          dailySalesMap.set(
            dateKey,
            {
              date: dateKey,
              revenue: 0,
              orders: 0,
              items: 0,
            }
          );
        }

        const dailyData =
          dailySalesMap.get(
            dateKey
          );

        dailyData.revenue +=
          itemRevenue;

        dailyData.items +=
          Number(item.quantity);

        // ======================================
        // TOP PRODUCTS
        // ======================================

        const productKey =
          item.product.toString();

        if (
          !topProductsMap.has(
            productKey
          )
        ) {
          topProductsMap.set(
            productKey,
            {
              productId:
                item.product,
              name: item.name,
              quantitySold: 0,
              revenue: 0,
            }
          );
        }

        const productData =
          topProductsMap.get(
            productKey
          );

        productData.quantitySold +=
          Number(item.quantity);

        productData.revenue +=
          itemRevenue;
      }

      // ========================================
      // DAILY ORDER COUNT
      // ========================================

      const dateKey =
        new Date(
          order.createdAt
        )
          .toISOString()
          .split("T")[0];

      const dailyData =
        dailySalesMap.get(
          dateKey
        );

      dailyData.orders++;
    }

    // ==========================================
    // FORMAT DAILY SALES
    // ==========================================

    const dailySales =
      Array.from(
        dailySalesMap.values()
      )
        .map((item) => ({
          date: item.date,
          revenue: Number(
            item.revenue.toFixed(2)
          ),
          orders: item.orders,
          items: item.items,
        }))
        .sort(
          (a, b) =>
            new Date(a.date) -
            new Date(b.date)
        );

    // ==========================================
    // FORMAT TOP PRODUCTS
    // ==========================================

    const topProducts =
      Array.from(
        topProductsMap.values()
      )
        .map((item) => ({
          ...item,
          revenue: Number(
            item.revenue.toFixed(2)
          ),
        }))
        .sort(
          (a, b) =>
            b.revenue -
            a.revenue
        )
        .slice(0, 10);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      analytics: {
        period: periodNumber,

        totalOrders,

        totalItemsSold,

        totalRevenue: Number(
          totalRevenue.toFixed(2)
        ),

        dailySales,

        topProducts,
      },
    });
  } catch (error) {
    console.error(
      "Get Seller Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching seller analytics",
    });
  }
};