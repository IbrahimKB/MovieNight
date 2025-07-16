import { RequestHandler } from "express";
import { z } from "zod";
import {
  ApiResponse,
  LoginRequest,
  SignupRequest,
  User,
} from "../models/types";
import { withTransaction, generateId } from "../utils/storage";

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

    const user = await withTransaction(async (db) => {
      // Find user by email or username
      const foundUser = db.users.find(
        (u) =>
          (u.email === body.email || u.username === body.email) &&
          u.password === body.password,
      );

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
        error: "Invalid email/username or password",
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: user,
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
