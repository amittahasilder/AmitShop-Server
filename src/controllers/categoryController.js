import Category from "../models/Category.js";

// ==========================================
// CREATE CATEGORY
// Admin only
// ==========================================

export const createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      image,
      isActive,
    } = req.body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Category name and slug are required",
      });
    }

    // ==========================================
    // CHECK DUPLICATE SLUG
    // ==========================================

    const existingCategory = await Category.findOne({
      slug: slug.toLowerCase().trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }

    // ==========================================
    // CREATE CATEGORY
    // ==========================================

    const category = await Category.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description || "",
      image: image || "",
      isActive:
        isActive !== undefined ? isActive : true,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Create Category Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating category",
    });
  }
};

// ==========================================
// GET ALL CATEGORIES
// Public
// ==========================================

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      totalCategories: categories.length,
      categories,
    });
  } catch (error) {
    console.error(
      "Get Categories Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching categories",
    });
  }
};

// ==========================================
// GET SINGLE CATEGORY
// Public
// ==========================================

export const getSingleCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findById(id);

    // ==========================================
    // CATEGORY NOT FOUND
    // ==========================================

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(
      "Get Single Category Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching category",
    });
  }
};

// ==========================================
// UPDATE CATEGORY
// Admin only
// ==========================================

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      description,
      image,
      isActive,
    } = req.body;

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ==========================================
    // CHECK DUPLICATE SLUG
    // ==========================================

    if (slug && slug.toLowerCase().trim() !== category.slug) {
      const existingCategory = await Category.findOne({
        slug: slug.toLowerCase().trim(),
        _id: { $ne: id },
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message:
            "A category with this slug already exists",
        });
      }
    }

    // ==========================================
    // UPDATE FIELDS
    // ==========================================

    if (name !== undefined) {
      category.name = name.trim();
    }

    if (slug !== undefined) {
      category.slug = slug.toLowerCase().trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (image !== undefined) {
      category.image = image;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    // ==========================================
    // SAVE CATEGORY
    // ==========================================

    await category.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Update Category Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating category",
    });
  }
};

// ==========================================
// DELETE CATEGORY
// Admin only
// ==========================================

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ==========================================
    // DELETE CATEGORY
    // ==========================================

    await Category.findByIdAndDelete(id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Category Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting category",
    });
  }
};