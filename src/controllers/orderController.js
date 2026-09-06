import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ==========================================
// CREATE ORDER
// POST /api/orders
// Login Required
// ==========================================

export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod = "COD",
      note = "",
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const {
      fullName,
      phone,
      address,
      city,
      state = "",
      postalCode,
      country,
    } = shippingAddress;

    if (
      !fullName ||
      !phone ||
      !address ||
      !city ||
      !postalCode ||
      !country
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, phone, address, city, postal code and country are required",
      });
    }

    // ==========================================
    // PAYMENT METHOD VALIDATION
    // ==========================================

    if (!["COD", "STRIPE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // ==========================================
    // FIND USER CART
    // ==========================================

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // ==========================================
    // PREPARE ORDER ITEMS
    // ==========================================

    const orderItems = [];

    let itemsPrice = 0;

    // ==========================================
    // CHECK PRODUCTS & STOCK
    // ==========================================

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product.name}`,
        });
      }

      // ------------------------------------------
      // CHECK ACTIVE STATUS
      // ------------------------------------------

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // ------------------------------------------
      // CHECK STOCK
      // ------------------------------------------

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) available for ${product.name}`,
        });
      }

      // ==========================================
      // CALCULATE PRODUCT PRICE
      // ==========================================

      const itemPrice =
        product.discountPrice !== null &&
        product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      const itemTotal = itemPrice * item.quantity;

      itemsPrice += itemTotal;

      // ==========================================
      // ORDER ITEM SNAPSHOT
      // ==========================================

      orderItems.push({
        product: product._id,
        name: product.name,
        image:
          product.images && product.images.length > 0
            ? product.images[0].url
            : "",
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // ==========================================
    // CALCULATE SHIPPING
    // ==========================================

    const shippingPrice = itemsPrice >= 100 ? 0 : 10;

    // ==========================================
    // CALCULATE TAX
    // ==========================================

    const taxPrice = Number(
      (itemsPrice * 0.05).toFixed(2)
    );

    // ==========================================
    // DISCOUNT
    // ==========================================

    const discountPrice = 0;

    // ==========================================
    // TOTAL PRICE
    // ==========================================

    const totalPrice = Number(
      (
        itemsPrice +
        shippingPrice +
        taxPrice -
        discountPrice
      ).toFixed(2)
    );

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const order = await Order.create({
      user: req.user._id,

      items: orderItems,

      shippingAddress: {
        fullName,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
      },

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",

      paymentId: "",

      itemsPrice,

      shippingPrice,

      taxPrice,

      discountPrice,

      totalPrice,

      note: note.trim(),
    });

    // ==========================================
    // REDUCE PRODUCT STOCK
    // ==========================================

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // ==========================================
    // CLEAR CART
    // ==========================================

    cart.items = [];

    await cart.save();

    // ==========================================
    // POPULATE ORDER
    // ==========================================

    await order.populate("user", "name email");

    await order.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating order",
    });
  }
};

// ==========================================
// GET MY ORDERS
// GET /api/orders/my-orders
// Login Required
// ==========================================

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("items.product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your orders",
    });
  }
};

// ==========================================
// GET SINGLE ORDER
// GET /api/orders/:orderId
// Login Required
// ==========================================

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // USER CAN ONLY VIEW OWN ORDER
    // ==========================================

    if (
      order.user._id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching order",
    });
  }
};

// ==========================================
// CANCEL MY ORDER
// PUT /api/orders/:orderId/cancel
// Login Required
// ==========================================

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CHECK OWNER
    // ==========================================

    if (
      order.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to cancel this order",
      });
    }

    // ==========================================
    // CHECK STATUS
    // ==========================================

    if (
      ["shipped", "delivered", "cancelled"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order cannot be cancelled",
      });
    }

    // ==========================================
    // RESTORE STOCK
    // ==========================================

    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity,
          },
        }
      );
    }

    // ==========================================
    // UPDATE ORDER
    // ==========================================

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();

    await order.save();

    await order.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while cancelling order",
    });
  }
};

// ==========================================
// ADMIN - GET ALL ORDERS
// GET /api/orders/admin/all
// Admin Required
// ==========================================

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email role")
      .populate("items.product")
      .sort({ createdAt: -1 });

    // ==========================================
    // CALCULATE TOTAL SALES
    // ==========================================

    const totalSales = orders
      .filter(
        (order) =>
          order.orderStatus !== "cancelled"
      )
      .reduce(
        (total, order) =>
          total + order.totalPrice,
        0
      );

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalSales: Number(totalSales.toFixed(2)),
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching all orders",
    });
  }
};

// ==========================================
// ADMIN - GET SINGLE ORDER
// GET /api/orders/admin/:orderId
// Admin Required
// ==========================================

export const getAdminOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId)
      .populate("user", "name email role")
      .populate("items.product");

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

// ==========================================
// ADMIN - UPDATE ORDER STATUS
// PUT /api/orders/admin/:orderId/status
// Admin Required
// ==========================================

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // VALIDATE STATUS
    // ==========================================

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // PREVENT CHANGING CANCELLED ORDER
    // ==========================================

    if (
      order.orderStatus === "cancelled" &&
      orderStatus !== "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled order status cannot be changed",
      });
    }

    // ==========================================
    // CANCEL ORDER
    // ==========================================

    if (
      orderStatus === "cancelled" &&
      order.orderStatus !== "cancelled"
    ) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          }
        );
      }

      order.cancelledAt = new Date();
    }

    // ==========================================
    // DELIVERED
    // ==========================================

    if (
      orderStatus === "delivered" &&
      order.orderStatus !== "delivered"
    ) {
      order.deliveredAt = new Date();
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    order.orderStatus = orderStatus;

    await order.save();

    await order.populate("user", "name email");

    await order.populate("items.product");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update Order Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating order status",
    });
  }
};

// ==========================================
// ADMIN - DELETE ORDER
// DELETE /api/orders/admin/:orderId
// Admin Required
// ==========================================

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // DELETE ORDER
    // ==========================================

    await Order.findByIdAndDelete(orderId);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting order",
    });
  }
};