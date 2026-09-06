import multer from "multer";

// ==========================================
// MULTER MEMORY STORAGE
// ==========================================

const storage = multer.memoryStorage();

// ==========================================
// FILE FILTER
// Only images allowed
// ==========================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ==========================================
// EXPORT
// ==========================================

export default upload;