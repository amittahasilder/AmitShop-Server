import mongoose from "mongoose";

import Review from "../models/Review.js";
import Product from "../models/Product.js";

// ==========================================
// ADD REVIEW
// POST /api/reviews
// Login Required
// ==========================================

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    if (comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at least 3 characters",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // CHECK EXISTING REVIEW
    // ==========================================

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // ==========================================
    // CREATE REVIEW
    // ==========================================

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: numericRating,
      comment: comment.trim(),
    });

    // ==========================================
    // UPDATE PRODUCT RATING
    // ==========================================

    await updateProductRating(productId);

    // ==========================================
    // POPULATE USER
    // ==========================================

    await review.populate(
      "user",
      "name email"
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Add Review Error:",
      error
    );

    // Duplicate key safety
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while adding review",
    });
  }
};

// ==========================================
// GET PRODUCT REVIEWS
// GET /api/reviews/product/:productId
// Public
// ==========================================

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // CHECK PRODUCT
    // ==========================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // GET REVIEWS
    // ==========================================

    const reviews = await Review.find({
      product: productId,
    })
      .populate("user", "name")
      .sort({
        createdAt: -1,
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      totalReviews: reviews.length,
      ratingAverage: product.ratingAverage || 0,
      reviews,
    });
  } catch (error) {
    console.error(
      "Get Product Reviews Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching reviews",
    });
  }
};

// ==========================================
// GET MY REVIEW
// GET /api/reviews/my/:productId
// Login Required
// ==========================================

export const getMyReview = async (req, res) => {
  try {
    const { productId } = req.params;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND REVIEW
    // ==========================================

    const review = await Review.findOne({
      user: req.user._id,
      product: productId,
    }).populate(
      "user",
      "name email"
    );

    // ==========================================
    // NOT FOUND
    // ==========================================

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "You have not reviewed this product",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error(
      "Get My Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your review",
    });
  }
};

// ==========================================
// UPDATE OWN REVIEW
// PUT /api/reviews/:reviewId
// Login Required
// ==========================================

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    if (
      rating === undefined &&
      comment === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    // ==========================================
    // FIND REVIEW
    // ==========================================

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // ==========================================
    // OWNERSHIP CHECK
    // ==========================================

    if (
      review.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    // ==========================================
    // UPDATE RATING
    // ==========================================

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be an integer between 1 and 5",
        });
      }

      review.rating = numericRating;
    }

    // ==========================================
    // UPDATE COMMENT
    // ==========================================

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
        });
      }

      if (comment.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message:
            "Comment must be at least 3 characters",
        });
      }

      review.comment = comment.trim();
    }

    // ==========================================
    // SAVE
    // ==========================================

    await review.save();

    // ==========================================
    // UPDATE PRODUCT RATING
    // ==========================================

    await updateProductRating(review.product);

    // ==========================================
    // POPULATE USER
    // ==========================================

    await review.populate(
      "user",
      "name email"
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Update Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating review",
    });
  }
};

// ==========================================
// DELETE OWN REVIEW
// DELETE /api/reviews/:reviewId
// Login Required
// ==========================================

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // ==========================================
    // FIND REVIEW
    // ==========================================

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // ==========================================
    // OWNERSHIP CHECK
    // ==========================================

    if (
      review.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    const productId = review.product;

    // ==========================================
    // DELETE
    // ==========================================

    await Review.findByIdAndDelete(reviewId);

    // ==========================================
    // UPDATE PRODUCT RATING
    // ==========================================

    await updateProductRating(productId);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting review",
    });
  }
};

// ==========================================
// UPDATE PRODUCT RATING HELPER
// ==========================================

const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(
          productId
        ),
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  // ==========================================
  // NO REVIEWS
  // ==========================================

  if (stats.length === 0) {
    await Product.findByIdAndUpdate(
      productId,
      {
        ratingAverage: 0,
        reviewCount: 0,
      }
    );

    return;
  }

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  await Product.findByIdAndUpdate(
    productId,
    {
      ratingAverage:
        Math.round(
          stats[0].averageRating * 10
        ) / 10,

      reviewCount:
        stats[0].reviewCount,
    }
  );
};