import mongoose from "mongoose";

// ==========================================
// ORDER ITEM SCHEMA
// ==========================================

const orderItemSchema = new mongoose.Schema(
  {
    // ==========================================
    // PRODUCT
    // ==========================================

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // ==========================================
    // PRODUCT NAME SNAPSHOT
    // ==========================================

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    // ==========================================
    // PRODUCT IMAGE SNAPSHOT
    // ==========================================

    image: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // PRICE SNAPSHOT
    // ==========================================

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    // ==========================================
    // QUANTITY
    // ==========================================

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// SHIPPING ADDRESS SCHEMA
// ==========================================

const shippingAddressSchema = new mongoose.Schema(
  {
    // ==========================================
    // FULL NAME
    // ==========================================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    // ==========================================
    // PHONE
    // ==========================================

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },

    // ==========================================
    // ADDRESS
    // ==========================================

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    // ==========================================
    // CITY
    // ==========================================

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },

    // ==========================================
    // POSTAL CODE
    // ==========================================

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },

    // ==========================================
    // COUNTRY
    // ==========================================

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters"],
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// ORDER SCHEMA
// ==========================================

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    // ==========================================
    // SHIPPING ADDRESS
    // ==========================================

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    paymentMethod: {
      type: String,
      enum: ["COD", "STRIPE"],
      default: "COD",
      required: true,
    },

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    // ==========================================
    // PAYMENT ID
    // ==========================================

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // ==========================================
    // ITEM TOTAL
    // ==========================================

    itemsPrice: {
      type: Number,
      required: true,
      min: [0, "Items price cannot be negative"],
      default: 0,
    },

    // ==========================================
    // SHIPPING PRICE
    // ==========================================

    shippingPrice: {
      type: Number,
      required: true,
      min: [0, "Shipping price cannot be negative"],
      default: 0,
    },

    // ==========================================
    // TAX PRICE
    // ==========================================

    taxPrice: {
      type: Number,
      required: true,
      min: [0, "Tax price cannot be negative"],
      default: 0,
    },

    // ==========================================
    // DISCOUNT
    // ==========================================

    discountPrice: {
      type: Number,
      required: true,
      min: [0, "Discount cannot be negative"],
      default: 0,
    },

    // ==========================================
    // TOTAL PRICE
    // ==========================================

    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
      default: 0,
    },

    // ==========================================
    // PAID AT
    // ==========================================

    paidAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // DELIVERED AT
    // ==========================================

    deliveredAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CANCELLED AT
    // ==========================================

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ORDER NOTE
    // ==========================================

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

// ==========================================
// MODEL
// ==========================================

const Order = mongoose.model("Order", orderSchema);

export default Order;