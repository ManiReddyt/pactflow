import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/database";
import healthRoutes from "./routes/healthRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";
import contractRoutes from "./routes/contractRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

dotenv.config();

// Connect to MongoDB
connectDB().then();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/health", healthRoutes);
app.use("/upload", uploadRoutes);
app.use("/users", userRoutes);
app.use("/contracts", contractRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Contract Lock Server",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`👤 User endpoints: http://localhost:${PORT}/api/users`);
  console.log(`📋 Contract endpoints: http://localhost:${PORT}/api/contracts`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
