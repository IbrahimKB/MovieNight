import { RequestHandler } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  ApiResponse,
  LoginRequest,
  SignupRequest,
  ResetPasswordRequest,
  User,
  JWTPayload,
} from "../models/types";
import { withTransaction, generateId } from "../utils/storage";

// JWT secret (in production, use environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || "movienight_dev_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Validation schemas
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login handler
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const body = loginSchema.parse(req.body) as LoginRequest;

    const result = await withTransaction(async (db) => {
      // Create admin user if it doesn't exist
      const adminExists = db.users.find((u) => u.username === "admin");
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 12);
        const adminUser: User = {
          id: generateId(),
          username: "admin",
          email: "admin@movienight.com",
          name: "Administrator",
          password: hashedPassword,
          role: "admin",
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.push(adminUser);
      }

      // Find user by email or username
      const foundUser = db.users.find(
        (u) => u.email === body.email || u.username === body.email,
      );

      if (!foundUser) {
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        body.password,
        foundUser.password,
      );
      if (!isPasswordValid) {
        return null;
      }

      // Generate JWT token
      const payload: JWTPayload = {
        userId: foundUser.id,
        role: foundUser.role,
      };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = foundUser;
      return { user: userWithoutPassword, token };
    });

    if (!result) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid email/username or password",
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse<{
      user: Omit<User, "password">;
      token: string;
    }> = {
      success: true,
      data: result,
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Signup handler
export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const body = signupSchema.parse(req.body) as SignupRequest;

    const newUser = await withTransaction(async (db) => {
      // Check if user already exists
      const existingUser = db.users.find(
        (u) => u.email === body.email || u.username === body.username,
      );

      if (existingUser) {
        throw new Error("User with this email or username already exists");
      }

      // Create new user
      const user: User = {
        id: generateId(),
        username: body.username,
        email: body.email,
        name: body.name,
        password: body.password, // In production, hash this
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.push(user);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: newUser,
      message: "Account created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    if (error instanceof Error) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Get current user profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const user = await withTransaction(async (db) => {
      const foundUser = db.users.find((u) => u.id === userId);

      if (!foundUser) {
        return null;
      }

      // Return user without password
      const { password, ...userWithoutPassword } = foundUser;
      return userWithoutPassword;
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: "User not found",
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: user,
    };

    res.json(response);
  } catch (error) {
    console.error("Get profile error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Search users
export const handleSearchUsers: RequestHandler = async (req, res) => {
  try {
    const query = req.query.q as string;
    const excludeUserId = req.query.exclude as string;

    if (!query || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Search query is required",
      };
      return res.status(400).json(response);
    }

    const users = await withTransaction(async (db) => {
      const searchTerm = query.toLowerCase().trim();

      return db.users
        .filter((user) => {
          // Exclude current user if specified
          if (excludeUserId && user.id === excludeUserId) return false;

          return (
            user.username.toLowerCase().includes(searchTerm) ||
            user.name.toLowerCase().includes(searchTerm)
          );
        })
        .map((user) => {
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
    });

    const response: ApiResponse<Omit<User, "password">[]> = {
      success: true,
      data: users,
    };

    res.json(response);
  } catch (error) {
    console.error("Search users error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};
