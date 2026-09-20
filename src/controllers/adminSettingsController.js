import StoreSettings from "../models/StoreSettings.js";

// =========================================================
// GET ADMIN / STORE SETTINGS
// GET /api/admin/settings
// =========================================================

export const getAdminSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();

    // যদি settings না থাকে → default settings তৈরি হবে
    if (!settings) {
      settings = await StoreSettings.create({
        updatedBy: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin settings fetched successfully",
      settings,
    });
  } catch (error) {
    console.error("Get Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin settings",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE ADMIN / STORE SETTINGS
// PUT /api/admin/settings
// =========================================================

export const updateAdminSettings = async (req, res) => {
  try {
    const {
      storeName,
      storeEmail,
      storePhone,
      currency,
      taxRate,
      freeShipping,
      lowStockAlert,
      emailNotifications,
      orderNotifications,
      maintenanceMode,
      allowReviews,
      autoApproveProducts,
    } = req.body;

    let settings = await StoreSettings.findOne();

    // যদি settings না থাকে → নতুন document তৈরি
    if (!settings) {
      settings = new StoreSettings();
    }

    // =======================================================
    // UPDATE FIELDS
    // =======================================================

    if (storeName !== undefined) {
      settings.storeName = storeName;
    }

    if (storeEmail !== undefined) {
      settings.storeEmail = storeEmail;
    }

    if (storePhone !== undefined) {
      settings.storePhone = storePhone;
    }

    if (currency !== undefined) {
      settings.currency = currency;
    }

    if (taxRate !== undefined) {
      settings.taxRate = Number(taxRate);
    }

    if (freeShipping !== undefined) {
      settings.freeShipping = Boolean(freeShipping);
    }

    if (lowStockAlert !== undefined) {
      settings.lowStockAlert = Boolean(lowStockAlert);
    }

    if (emailNotifications !== undefined) {
      settings.emailNotifications = Boolean(emailNotifications);
    }

    if (orderNotifications !== undefined) {
      settings.orderNotifications = Boolean(orderNotifications);
    }

    if (maintenanceMode !== undefined) {
      settings.maintenanceMode = Boolean(maintenanceMode);
    }

    if (allowReviews !== undefined) {
      settings.allowReviews = Boolean(allowReviews);
    }

    if (autoApproveProducts !== undefined) {
      settings.autoApproveProducts = Boolean(autoApproveProducts);
    }

    // কে update করেছে
    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Admin settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update admin settings",
      error: error.message,
    });
  }
};