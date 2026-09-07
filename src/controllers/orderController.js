import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ==========================================
// HELPER: VALIDATE ORDER ID
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// HELPER: GET PRODUCT SELLING PRICE
// ==========================================

const getProductPrice = (product) => {
  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }

  return product.price;
};

// ==========================================
// HELPER: STATUS NOTE
// ==========================================

const getDefaultStatusNote = (status) => {
  const notes = {
    pending: "Order placed",
    confirmed: "Order confirmed",
    processing: "Order is being processed",
    shipped: "Order has been shipped",
    delivered: "Order delivered successfully",
    cancelled: "Order cancelled",
  };

  return notes[status] || "";
};

// ==========================================
// HELPER: ADD STATUS HISTORY
// ==========================================

const addStatusHistory = (
  order,
  status,
  updatedBy,
  note = ""
) => {
  order.statusHistory.push({
    status,
    note: note?.trim() || getDefaultStatusNote(status),
    updatedBy: updatedBy || null,
    createdAt: new Date(),
  });
};

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
    // VALIDATE SHIPPING ADDRESS
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
      !fullName?.trim() ||
      !phone?.trim() ||
      !address?.trim() ||
      !city?.trim() ||
      !postalCode?.trim() ||
      !country?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, phone, address, city, postal code and country are required",
      });
    }

    // ==========================================
    // VALIDATE PAYMENT METHOD
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

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // ==========================================
    // PREPARE ORDER ITEMS
    // ==========================================

    const orderItems = [];
    const stockUpdates = [];

    let itemsPrice = 0;

    // ==========================================
    // CHECK PRODUCTS + STOCK
    // ==========================================

    for (const cartItem of cart.items) {
      // ------------------------------------------
      // CHECK PRODUCT EXISTS
      // ------------------------------------------

      if (!cartItem.product) {
        return res.status(404).json({
          success: false,
          message:
            "One of the products in your cart no longer exists",
        });
      }

      const productId = cartItem.product._id;

      // ------------------------------------------
      // FETCH LATEST PRODUCT
      // ------------------------------------------

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "One of the products in your cart no longer exists",
        });
      }

      // ------------------------------------------
      // CHECK ACTIVE
      // ------------------------------------------

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }

      // ------------------------------------------
      // VALIDATE QUANTITY
      // ------------------------------------------

      if (
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      // ------------------------------------------
      // CHECK STOCK
      // ------------------------------------------

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) available for ${product.name}`,
        });
      }

      // ------------------------------------------
      // CALCULATE PRICE
      // ------------------------------------------

      const itemPrice = getProductPrice(product);

      const itemTotal =
        itemPrice * cartItem.quantity;

      itemsPrice += itemTotal;

      // ------------------------------------------
      // ORDER ITEM SNAPSHOT
      // ------------------------------------------

      orderItems.push({
        product: product._id,
        name: product.name,
        image:
          product.images &&
          product.images.length > 0
            ? product.images[0].url
            : "",
        price: itemPrice,
        quantity: cartItem.quantity,
      });

      // ------------------------------------------
      // PREPARE STOCK UPDATE
      // ------------------------------------------

      stockUpdates.push({
        productId: product._id,
        quantity: cartItem.quantity,
      });
    }

    // ==========================================
    // ROUND ITEMS PRICE
    // ==========================================

    itemsPrice = Number(
      itemsPrice.toFixed(2)
    );

    // ==========================================
    // SHIPPING PRICE
    // Free shipping >= 100
    // ==========================================

    const shippingPrice =
      itemsPrice >= 100 ? 0 : 10;

    // ==========================================
    // TAX
    // 5%
    // ==========================================

    const taxPrice = Number(
      (itemsPrice * 0.05).toFixed(2)
    );

    // ==========================================
    // DISCOUNT
    // Coupon integration will be added later
    // ==========================================

    const discountPrice = 0;

    // ==========================================
    // TOTAL
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
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state?.trim() || "",
        postalCode: postalCode.trim(),
        country: country.trim(),
      },

      paymentMethod,

      // Stripe payment will update this later
      paymentStatus: "pending",

      paymentId: "",

      orderStatus: "pending",

      // ==========================================
      // INITIAL STATUS HISTORY
      // ==========================================

      statusHistory: [
        {
          status: "pending",
          note: "Order placed",
          updatedBy: req.user._id,
          createdAt: new Date(),
        },
      ],

      itemsPrice,

      shippingPrice,

      taxPrice,

      discountPrice,

      totalPrice,

      note:
        typeof note === "string"
          ? note.trim()
          : "",
    });

    // ==========================================
    // DECREASE STOCK SAFELY
    // ==========================================

    for (const update of stockUpdates) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: update.productId,
            stock: {
              $gte: update.quantity,
            },
          },
          {
            $inc: {
              stock: -update.quantity,
            },
          },
          {
            new: true,
          }
        );

      // ==========================================
      // STOCK CHANGED BETWEEN CHECK & UPDATE
      // ==========================================

      if (!updatedProduct) {
        // ----------------------------------------
        // ROLLBACK PREVIOUS STOCK UPDATES
        // ----------------------------------------

        for (const completedUpdate of stockUpdates) {
          if (
            completedUpdate.productId.toString() ===
            update.productId.toString()
          ) {
            break;
          }

          await Product.findByIdAndUpdate(
            completedUpdate.productId,
            {
              $inc: {
                stock: completedUpdate.quantity,
              },
            }
          );
        }

        // ----------------------------------------
        // DELETE CREATED ORDER
        // ----------------------------------------

        await Order.findByIdAndDelete(
          order._id
        );

        return res.status(400).json({
          success: false,
          message:
            "Stock changed while creating your order. Please try again.",
        });
      }
    }

    // ==========================================
    // CLEAR CART
    // ==========================================

    cart.items = [];

    await cart.save();

    // ==========================================
    // POPULATE ORDER
    // ==========================================

    await order.populate(
      "user",
      "name email"
    );

    await order.populate(
      "items.product"
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create Order Error:",
      error
    );

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

export const getMyOrders = async (
  req,
  res
) => {
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
    console.error(
      "Get My Orders Error:",
      error
    );

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

export const getOrderById = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    )
      .populate(
        "user",
        "name email"
      )
      .populate("items.product");

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
      order.user._id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get Order By ID Error:",
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
// GET ORDER TRACKING
// GET /api/orders/:orderId/tracking
// Customer + Admin
// ==========================================

export const getOrderTracking = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    )
      .select(
        "_id user orderStatus statusHistory createdAt updatedAt"
      )
      .populate(
        "statusHistory.updatedBy",
        "name email role"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CUSTOMER OWNERSHIP CHECK
    // ADMIN CAN VIEW ALL
    // ==========================================

    const isAdmin =
      req.user.role === "admin";

    if (
      !isAdmin &&
      order.user.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to track this order",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      tracking: {
        orderId: order._id,
        currentStatus: order.orderStatus,
        statusHistory:
          order.statusHistory || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get Order Tracking Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching order tracking",
    });
  }
};

// ==========================================
// CANCEL MY ORDER
// PUT /api/orders/:orderId/cancel
// Login Required
// ==========================================

export const cancelOrder = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    );

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
      [
        "shipped",
        "delivered",
        "cancelled",
      ].includes(order.orderStatus)
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

    // ==========================================
    // ADD STATUS HISTORY
    // ==========================================

    addStatusHistory(
      order,
      "cancelled",
      req.user._id,
      "Order cancelled by customer"
    );

    await order.save();

    // ==========================================
    // POPULATE
    // ==========================================

    await order.populate(
      "user",
      "name email"
    );

    await order.populate(
      "items.product"
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Cancel Order Error:",
      error
    );

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

export const getAllOrders = async (
  req,
  res
) => {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "name email role"
      )
      .populate("items.product")
      .sort({ createdAt: -1 });

    // ==========================================
    // TOTAL SALES
    // ==========================================

    const totalSales = orders
      .filter(
        (order) =>
          order.orderStatus !==
          "cancelled"
      )
      .reduce(
        (total, order) =>
          total + order.totalPrice,
        0
      );

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalSales: Number(
        totalSales.toFixed(2)
      ),
      orders,
    });
  } catch (error) {
    console.error(
      "Get All Orders Error:",
      error
    );

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

export const getAdminOrderById = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    )
      .populate(
        "user",
        "name email role"
      )
      .populate("items.product")
      .populate(
        "statusHistory.updatedBy",
        "name email role"
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

// ==========================================
// ADMIN - UPDATE ORDER STATUS
// PUT /api/orders/admin/:orderId/status
// Admin Required
// ==========================================

export const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    const {
      orderStatus,
      statusNote = "",
    } = req.body;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
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

    if (
      !allowedStatuses.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // ==========================================
    // VALIDATE STATUS NOTE
    // ==========================================

    if (
      statusNote &&
      typeof statusNote !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status note must be a string",
      });
    }

    if (
      typeof statusNote === "string" &&
      statusNote.length > 300
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status note cannot exceed 300 characters",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CANCELLED ORDER CANNOT REOPEN
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
    // ALREADY SAME STATUS
    // ==========================================

    if (
      order.orderStatus ===
      orderStatus
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order is already ${orderStatus}`,
      });
    }

    // ==========================================
    // CANCEL ORDER
    // ==========================================

    if (orderStatus === "cancelled") {
      // ----------------------------------------
      // RESTORE STOCK
      // ----------------------------------------

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

      order.cancelledAt =
        new Date();
    }

    // ==========================================
    // DELIVERED
    // ==========================================

    if (orderStatus === "delivered") {
      order.deliveredAt =
        new Date();
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    order.orderStatus =
      orderStatus;

    // ==========================================
    // ADD STATUS HISTORY
    // ==========================================

    addStatusHistory(
      order,
      orderStatus,
      req.user._id,
      statusNote
    );

    // ==========================================
    // SAVE
    // ==========================================

    await order.save();

    // ==========================================
    // POPULATE
    // ==========================================

    await order.populate(
      "user",
      "name email"
    );

    await order.populate(
      "items.product"
    );

    await order.populate(
      "statusHistory.updatedBy",
      "name email role"
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
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

export const deleteOrder = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // DELETE ORDER
    // ==========================================

    await Order.findByIdAndDelete(
      orderId
    );

    return res.status(200).json({
      success: true,
      message:
        "Order deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting order",
    });
  }
};