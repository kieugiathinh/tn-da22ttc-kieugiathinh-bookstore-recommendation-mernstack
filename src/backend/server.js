import app from "./app.js";
import dotenv from "dotenv";
import dbConnection from "./config/db.js";

dotenv.config();

// Connect to Database
dbConnection();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// Handle unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
