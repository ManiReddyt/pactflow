import express from "express";
import {
  createUser,
  getUserByEmail,
  getUserProfile,
  updateUser,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Public routes
router.post("/", createUser); // Create new user

// Protected routes (require JWT token)
router.get("/profile", authenticateToken, getUserProfile); // Get user profile
router.patch("/profile", authenticateToken, updateUser); // Update user profile
router.get("/by-email/:email", authenticateToken, getUserByEmail); // get user by email

export default router;
