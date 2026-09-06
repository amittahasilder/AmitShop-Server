import mongoose from "mongoose";

// ==========================================
// WISHLIST ITEM SCHEMA
// ==========================================

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// WISHLIST SCHEMA
// ==========================================

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// EXPORT MODEL
// ==========================================

const Wishlist = mongoose.model(
  "Wishlist",
  wishlistSchema
);

export default Wishlist;