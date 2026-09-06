import mongoose from "mongoose";
import { Readable } from "stream";

import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

// ==========================================
// CLOUDINARY UPLOAD HELPER
// ==========================================

const uploadToCloudinary = (buffer, folder = "amitshop/products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// ==========================================
// CLOUDINARY DELETE HELPER
// ==========================================

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(
      "Cloudinary Delete Error:",
      error.message
    );
  }
};

// ==========================================
// CREATE PRODUCT
// POST /api/products
// Login Required
// ==========================================

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      discountPrice,
      category,
      brand,
      stock,
    } = req.body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      !name ||
      !slug ||
      !description ||
      price === undefined ||
      !category ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, description, price, category and stock are required",
      });
    }

    // ==========================================
    // VALIDATE PRICE
    // ==========================================

    const productPrice = Number(price);
    const productStock = Number(stock);

    if (
      !Number.isFinite(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    if (
      !Number.isInteger(productStock) ||
      productStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a valid non-negative integer",
      });
    }

    // ==========================================
    // CHECK DISCOUNT PRICE
    // ==========================================

    let finalDiscountPrice = null;

    if (
      discountPrice !== undefined &&
      discountPrice !== ""
    ) {
      finalDiscountPrice = Number(discountPrice);

      if (
        !Number.isFinite(finalDiscountPrice) ||
        finalDiscountPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount price must be a valid non-negative number",
        });
      }

      if (finalDiscountPrice > productPrice) {
        return res.status(400).json({
          success: false,
          message:
            "Discount price cannot be greater than product price",
        });
      }
    }

    // ==========================================
    // CHECK DUPLICATE SLUG
    // ==========================================

    const existingProduct = await Product.findOne({
      slug: slug.trim().toLowerCase(),
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this slug already exists",
      });
    }

    // ==========================================
    // UPLOAD IMAGES TO CLOUDINARY
    // ==========================================

    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer
        );

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product = await Product.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      price: productPrice,
      discountPrice: finalDiscountPrice,
      category: category.trim(),
      brand: brand ? brand.trim() : "",
      images: uploadedImages,
      stock: productStock,
      seller: req.user._id,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating product",
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// GET /api/products
// ==========================================

export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    // ==========================================
    // BUILD FILTER
    // ==========================================

    const filter = {
      isActive: true,
    };

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
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    if (category) {
      filter.category = category;
    }

    // ==========================================
    // BRAND
    // ==========================================

    if (brand) {
      filter.brand = brand;
    }

    // ==========================================
    // PRICE RANGE
    // ==========================================

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      filter.price = {};

      if (minPrice !== undefined) {
        const min = Number(minPrice);

        if (!Number.isNaN(min)) {
          filter.price.$gte = min;
        }
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);

        if (!Number.isNaN(max)) {
          filter.price.$lte = max;
        }
      }
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const productsPerPage = Math.min(
      Math.max(Number(limit) || 12, 1),
      100
    );

    const skip =
      (currentPage - 1) * productsPerPage;

    // ==========================================
    // SORTING
    // ==========================================

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price-low") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price-high") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "rating") {
      sortOption = {
        ratings: -1,
      };
    }

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const [products, totalProducts] =
      await Promise.all([
        Product.find(filter)
          .sort(sortOption)
          .skip(skip)
          .limit(productsPerPage),

        Product.countDocuments(filter),
      ]);

    // ==========================================
    // PAGINATION INFO
    // ==========================================

    const totalPages = Math.ceil(
      totalProducts / productsPerPage
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage,
        productsPerPage,
        totalProducts,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get Products Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching products",
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ==========================================

export const getSingleProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get Single Product Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the product",
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// Login Required
// ==========================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // SELLER OWNERSHIP CHECK
    // ==========================================

    if (
      req.user.role === "seller" &&
      product.seller.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update your own products",
      });
    }

    const {
      name,
      slug,
      description,
      price,
      discountPrice,
      category,
      brand,
      stock,
    } = req.body;

    // ==========================================
    // CHECK DUPLICATE SLUG
    // ==========================================

    if (
      slug &&
      slug.trim().toLowerCase() !== product.slug
    ) {
      const existingProduct =
        await Product.findOne({
          slug: slug.trim().toLowerCase(),
          _id: {
            $ne: id,
          },
        });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this slug already exists",
        });
      }
    }

    // ==========================================
    // UPDATE BASIC FIELDS
    // ==========================================

    if (name !== undefined) {
      product.name = name.trim();
    }

    if (slug !== undefined) {
      product.slug =
        slug.trim().toLowerCase();
    }

    if (description !== undefined) {
      product.description =
        description.trim();
    }

    if (price !== undefined) {
      const newPrice = Number(price);

      if (
        !Number.isFinite(newPrice) ||
        newPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid price",
        });
      }

      product.price = newPrice;
    }

    if (discountPrice !== undefined) {
      if (discountPrice === "") {
        product.discountPrice = null;
      } else {
        const newDiscountPrice =
          Number(discountPrice);

        if (
          !Number.isFinite(newDiscountPrice) ||
          newDiscountPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid discount price",
          });
        }

        const currentPrice =
          product.price;

        if (
          newDiscountPrice > currentPrice
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Discount price cannot be greater than product price",
          });
        }

        product.discountPrice =
          newDiscountPrice;
      }
    }

    if (category !== undefined) {
      product.category =
        category.trim();
    }

    if (brand !== undefined) {
      product.brand = brand.trim();
    }

    if (stock !== undefined) {
      const newStock = Number(stock);

      if (
        !Number.isInteger(newStock) ||
        newStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock",
        });
      }

      product.stock = newStock;
    }

    // ==========================================
    // ADD NEW IMAGES
    // ==========================================

    if (
      req.files &&
      req.files.length > 0
    ) {
      for (const file of req.files) {
        const result =
          await uploadToCloudinary(
            file.buffer
          );

        product.images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    // ==========================================
    // SAVE PRODUCT
    // ==========================================

    await product.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Update Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating product",
    });
  }
};

// ==========================================
// DELETE PRODUCT
// DELETE /api/products/:id
// Login Required
// ==========================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // SELLER OWNERSHIP CHECK
    // ==========================================

    if (
      req.user.role === "seller" &&
      product.seller.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own products",
      });
    }

    // ==========================================
    // DELETE CLOUDINARY IMAGES
    // ==========================================

    if (
      product.images &&
      product.images.length > 0
    ) {
      for (const image of product.images) {
        if (image.publicId) {
          await deleteFromCloudinary(
            image.publicId
          );
        }
      }
    }

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    await Product.findByIdAndDelete(id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Product and images deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting product",
    });
  }
};