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
    // Validate request body
    if (!req.body || typeof req.body !== "object") {
      const response: ApiResponse = {
        success: false,
        error: "Invalid request body",
      };
      return res.status(400).json(response);
    }

    const body = loginSchema.parse(req.body) as LoginRequest;

    const result = await withTransaction(async (db) => {
      console.log("Login attempt:", { email: body.email, password: "***" });

      // Create admin user if it doesn't exist or recreate if password doesn't work
      let adminExists = db.users.find((u) => u.username === "admin");

      if (adminExists) {
        // Test if existing admin password works
        const testPassword = await bcrypt.compare(
          "admin123",
          adminExists.password,
        );
        console.log("Testing existing admin password:", testPassword);

        if (!testPassword) {
          console.log(
            "Existing admin password invalid, recreating admin user...",
          );
          // Remove old admin user
          db.users = db.users.filter((u) => u.username !== "admin");
          adminExists = null;
        } else {
          console.log("Admin user exists with valid password");
        }
      }

      if (!adminExists) {
        console.log("Creating new admin user...");
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
        console.log("Admin user created successfully");

        // Test the new password immediately
        const testNewPassword = await bcrypt.compare(
          "admin123",
          hashedPassword,
        );
        console.log("New admin password test:", testNewPassword);
      }

      // Find user by email or username
      const foundUser = db.users.find(
        (u) => u.email === body.email || u.username === body.email,
      );

      console.log("User found:", foundUser ? "Yes" : "No");
      console.log(
        "Available users:",
        db.users.map((u) => ({
          username: u.username,
          email: u.email,
          hasPassword: !!u.password,
        })),
      );

      if (!foundUser) {
        console.log("User not found for:", body.email);
        return null;
      }

      // Verify password - handle both hashed and plaintext for migration
      console.log("Verifying password...");
      let isPasswordValid = false;

      // Check if password is already hashed (starts with $2b$ for bcrypt)
      if (foundUser.password.startsWith("$2b$")) {
        // Use bcrypt compare for hashed passwords
        isPasswordValid = await bcrypt.compare(
          body.password,
          foundUser.password,
        );
        console.log("Password validation (bcrypt):", isPasswordValid);
      } else {
        // Plain text comparison for legacy users, then hash and update
        isPasswordValid = body.password === foundUser.password;
        console.log("Password validation (plaintext):", isPasswordValid);

        if (isPasswordValid) {
          console.log("Migrating user to hashed password...");
          // Hash the password and update user record
          const hashedPassword = await bcrypt.hash(body.password, 12);
          foundUser.password = hashedPassword;
          foundUser.updatedAt = new Date().toISOString();

          // Update user role if not set
          if (!foundUser.role) {
            foundUser.role = "user";
          }

          console.log("User password migrated to bcrypt hash");
        }
      }

      if (!isPasswordValid) {
        console.log("Password verification failed");
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
      console.log("Login failed: Invalid credentials");
      const response: ApiResponse = {
        success: false,
        error: "Invalid email/username or password",
      };
      return res.status(401).json(response);
    }

    console.log("Login successful for user:", result.user.username);

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

    const result = await withTransaction(async (db) => {
      // Check if user already exists
      const existingUser = db.users.find(
        (u) => u.email === body.email || u.username === body.username,
      );

      if (existingUser) {
        throw new Error("User with this email or username already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 12);

      // Create new user
      const user: User = {
        id: generateId(),
        username: body.username,
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: "user", // Default role is user
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.push(user);

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        role: user.role,
      };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    });

    const response: ApiResponse<{
      user: Omit<User, "password">;
      token: string;
    }> = {
      success: true,
      data: result,
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

// JWT verification middleware
export const verifyJWT: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: "Access token required",
    };
    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: "Invalid or expired token",
    };
    return res.status(401).json(response);
  }
};

// Admin role verification middleware
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: "Authentication required",
    };
    return res.status(401).json(response);
  }

  if (req.user.role !== "admin") {
    const response: ApiResponse = {
      success: false,
      error: "Admin access required",
    };
    return res.status(403).json(response);
  }

  next();
};

// Password reset schema
const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Reset password handler (admin only)
export const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body) as ResetPasswordRequest;

    const updatedUser = await withTransaction(async (db) => {
      const userIndex = db.users.findIndex((u) => u.id === body.userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 12);

      // Update user password
      db.users[userIndex] = {
        ...db.users[userIndex],
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      };

      // Return user without password
      const { password, ...userWithoutPassword } = db.users[userIndex];
      return userWithoutPassword;
    });

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: updatedUser,
      message: "Password reset successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Reset password error:", error);

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

// Get all users (admin only)
export const handleGetAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await withTransaction(async (db) => {
      return db.users.map((user) => {
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
    console.error("Get all users error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Internal server error",
    };
    res.status(500).json(response);
  }
};

// Delete user (admin only)
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const deletedUser = await withTransaction(async (db) => {
      const userIndex = db.users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      // Don't allow deleting admin user
      if (db.users[userIndex].role === "admin") {
        throw new Error("Cannot delete admin user");
      }

      const deletedUser = db.users[userIndex];
      db.users.splice(userIndex, 1);

      // Also clean up related data
      db.friendships = db.friendships.filter(
        (f) => f.userId1 !== userId && f.userId2 !== userId,
      );
      db.suggestions = db.suggestions.filter(
        (s) => s.suggestedBy !== userId && !s.suggestedTo.includes(userId),
      );
      db.watchDesires = db.watchDesires.filter((w) => w.userId !== userId);
      db.watchedMovies = db.watchedMovies.filter((w) => w.userId !== userId);
      db.notifications = db.notifications.filter((n) => n.userId !== userId);

      const { password, ...userWithoutPassword } = deletedUser;
      return userWithoutPassword;
    });

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: deletedUser,
      message: "User deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Delete user error:", error);

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
