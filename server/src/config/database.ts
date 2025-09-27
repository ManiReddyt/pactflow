import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log("mongoURI :", mongoURI);

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗃️  Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("❌ MongoDB error:", error);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed through app termination");
  process.exit(0);
});

export default connectDB;
