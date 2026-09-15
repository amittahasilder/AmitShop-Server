import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

// ==========================================
// UPDATE PROFILE
// ==========================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      phone,
      address,
      city,
      postalCode,
      country,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = trimmedName;
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    if (city !== undefined) {
      user.city = city.trim();
    }

    if (postalCode !== undefined) {
      user.postalCode = postalCode.trim();
    }

    if (country !== undefined) {
      user.country = country.trim();
    }

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// ==========================================
// UPLOAD PROFILE AVATAR
// ==========================================
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ======================================
    // UPLOAD BUFFER TO CLOUDINARY
    // ======================================

    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "amitshop/avatars",
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

        Readable.from(req.file.buffer).pipe(uploadStream);
      });
    };

    const result = await uploadToCloudinary();

    // ======================================
    // SAVE CLOUDINARY URL
    // ======================================

    user.avatar = result.secure_url;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select(
      "-password"
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      user: updatedUser,
      avatar: result.secure_url,
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
    });
  }
};