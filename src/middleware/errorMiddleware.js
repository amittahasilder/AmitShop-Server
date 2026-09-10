// ==========================================
// GLOBAL ERROR MIDDLEWARE
// ==========================================

export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // ------------------------------------------
  // Default Error
  // ------------------------------------------

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ------------------------------------------
  // Mongoose Validation Error
  // ------------------------------------------

  if (err.name === "ValidationError") {
    statusCode = 400;

    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    message = messages.join(", ");
  }

  // ------------------------------------------
  // Mongoose Cast Error
  // ------------------------------------------

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ------------------------------------------
  // MongoDB Duplicate Key Error
  // ------------------------------------------

  if (err.code === 11000) {
    statusCode = 409;

    const fields = Object.keys(err.keyValue || {});

    message = `Duplicate value for: ${fields.join(", ")}`;
  }

  // ------------------------------------------
  // JWT Errors
  // ------------------------------------------

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  // ------------------------------------------
  // Multer Errors
  // ------------------------------------------

  if (err.name === "MulterError") {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size is too large";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded";
    } else {
      message = err.message;
    }
  }

  // ------------------------------------------
  // Final Response
  // ------------------------------------------

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      error: err.name || "Error",
    }),
  });
};