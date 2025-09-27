import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../middleware/auth";
import {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  AuthenticatedRequest,
} from "../types";
import { v4 as uuidv4 } from "uuid";

// Create new user
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      publickeyhash,
      evm_address,
      mail,
      nft_addresses = {},
    }: CreateUserRequest = req.body;

    // Validate required fields
    if (!username || !publickeyhash || !evm_address || !mail) {
      res.status(400).json({
        success: false,
        message:
          "All required fields (username, publickeyhash, evm_address, mail) must be provided",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ evm_address }, { publickeyhash }, { mail }],
    });

    if (existingUser) {
      // If user exists, treat as login and return same response as successful creation
      const token = generateToken({
        uid: existingUser.uid,
        evm_address: existingUser.evm_address,
        publickeyhash: existingUser.publickeyhash,
      });

      const response: CreateUserResponse = {
        success: true,
        message: "User already exists, logged in successfully",
        user: existingUser,
        token,
      };

      res.status(200).json(response);
      return;
    }

    // Generate unique UID
    const uid = uuidv4();

    // Create new user
    const newUser = new User({
      uid,
      username,
      publickeyhash,
      evm_address,
      mail,
      nft_addresses,
      contracts: [],
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = generateToken({
      uid: savedUser.uid,
      evm_address: savedUser.evm_address,
      publickeyhash: savedUser.publickeyhash,
    });

    const response: CreateUserResponse = {
      success: true,
      message: "User created successfully",
      user: savedUser,
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating user",
    });
  }
};

// Get user profile
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const user = await User.findOne({ uid: req.user.uid }).select("-__v");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving user profile",
    });
  }
};

// Update user profile
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { username, mail, nft_addresses } = req.body as UpdateUserRequest;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (mail) updateData.mail = mail;
    if (nft_addresses) updateData.nft_addresses = nft_addresses;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
      return;
    }

    // Check if email is already taken by another user
    if (mail) {
      const existingUser = await User.findOne({
        mail,
        uid: { $ne: req.user.uid },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "Email is already taken by another user",
        });
        return;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { uid: req.user.uid },
      updateData,
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating user profile",
    });
  }
};

// Get user profile by email
export const getUserByEmail = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const { email } = req.params;
    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const user = await User.findOne({ mail: email }).select("-__v");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving user profile",
    });
  }
};
