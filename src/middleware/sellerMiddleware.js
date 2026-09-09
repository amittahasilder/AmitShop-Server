// ==========================================
// SELLER ROLE PROTECTION
// ==========================================

export const sellerOnly = (
  req,
  res,
  next
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message:
          "Seller access required",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Seller Middleware Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while checking seller access",
    });
  }
};