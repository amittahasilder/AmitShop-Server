import mongoose from "mongoose";

// ==========================================
// CATEGORY SCHEMA
// ==========================================

const categorySchema = new mongoose.Schema(
  {
    // ==========================================
    // CATEGORY NAME
    // ==========================================

    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ==========================================
    // CATEGORY SLUG
    // ==========================================

    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // DESCRIPTION
    // ==========================================

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ==========================================
    // IMAGE
    // ==========================================

    image: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // ACTIVE STATUS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// EXPORT MODEL
// ==========================================

const Category = mongoose.model("Category", categorySchema);

export default Category;