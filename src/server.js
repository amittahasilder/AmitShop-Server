import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();

    // Start Server
    app.listen(PORT, () => {
      console.log("");
      console.log("=================================");
      console.log("🚀 AmitShop Server Started");
      console.log(`🌐 http://localhost:${PORT}`);
      console.log("=================================");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Server failed to start");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();