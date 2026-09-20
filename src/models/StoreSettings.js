import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "AmitShop",
      trim: true,
    },

    storeEmail: {
      type: String,
      default: "amitshop.test@gmail.com",
      trim: true,
      lowercase: true,
    },

    storePhone: {
      type: String,
      default: "",
      trim: true,
    },

    currency: {
      type: String,
      enum: ["USD", "BDT", "EUR", "GBP"],
      default: "USD",
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    freeShipping: {
      type: Boolean,
      default: false,
    },

    lowStockAlert: {
      type: Boolean,
      default: true,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    orderNotifications: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    allowReviews: {
      type: Boolean,
      default: true,
    },

    autoApproveProducts: {
      type: Boolean,
      default: false,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const StoreSettings = mongoose.model(
  "StoreSettings",
  storeSettingsSchema
);

export default StoreSettings;