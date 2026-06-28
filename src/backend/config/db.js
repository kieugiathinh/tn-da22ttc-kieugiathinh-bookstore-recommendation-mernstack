import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbConnection = async () => {
  const DB = process.env.DB;
  if (!DB) {
    console.error("❌ Mongoose Connection Error: DB URI is missing in .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(DB, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`✅ Database connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Mongoose Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

// Graceful shutdown
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose connection disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 Mongoose connection closed due to app termination");
  process.exit(0);
});

export default dbConnection;
