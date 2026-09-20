import bcrypt from "bcryptjs";
import User from "../models/User.js";

// =========================================================
// CHANGE ADMIN PASSWORD
// PUT /api/admin/security/password
// =========================================================

export const changeAdminPassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    // =====================================================
    // CONFIRM NEW PASSWORD
    // =====================================================

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // =====================================================
    // PASSWORD LENGTH
    // =====================================================

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    // =====================================================
    // GET CURRENT ADMIN WITH PASSWORD
    // =====================================================

    const admin = await User.findById(req.user._id).select(
      "+password"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // =====================================================
    // ROLE CHECK
    // =====================================================

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can change this password",
      });
    }

    // =====================================================
    // VERIFY CURRENT PASSWORD
    // =====================================================

    const isCurrentPasswordCorrect =
      await bcrypt.compare(
        currentPassword,
        admin.password
      );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // =====================================================
    // PREVENT SAME PASSWORD
    // =====================================================

    const isSamePassword = await bcrypt.compare(
      newPassword,
      admin.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    // =====================================================
    // HASH NEW PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    admin.password = hashedPassword;

    await admin.save();

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change Admin Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to change admin password",
      error: error.message,
    });
  }
};