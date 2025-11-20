// server/routes/auth.ts
import { RequestHandler } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import {
  ApiResponse,
  LoginRequest,
  SignupRequest,
  ResetPasswordRequest,
  User,
  JWTPayload,
} from "../models/types.js";
import { sql } from "../db/sql.js";

// ---------------------------------------------------------------------------
// Local DB type matching auth."User"
// ---------------------------------------------------------------------------
interface AuthUserRow {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  name: string | null;
  role: string | null;
  joinedAt: Date | null;
  puid: string | null;
}

// ---------------------------------------------------------------------------
// JWT config
// ---------------------------------------------------------------------------
const JWT_SECRET =
  process.env.JWT_SECRET || "movienight_dev_secret_key_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"), // can be id or puid
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// ---------------------------------------------------------------------------
// Helper: map DB row → API User
// ---------------------------------------------------------------------------
function mapAuthUserToUserRow(authUser: AuthUserRow): User {
  // Prefer public user id (puid) if present, else fallback to internal id
  const id = authUser.puid ?? authUser.id;

  const joinedAtSource = authUser.joinedAt ?? authUser.createdAt;

  return {
    id,
    username: authUser.username,
    email: authUser.email,
    // name is optional in DB; fallback to username if missing
    name: authUser.name ?? authUser.username,
    // password is NEVER exposed
    password: "",
    role: (authUser.role as any) ?? "user",
    joinedAt: joinedAtSource.toISOString(),
    createdAt: authUser.createdAt.toISOString(),
    updatedAt: authUser.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helper: create JWT
// ---------------------------------------------------------------------------
function createJwtForUser(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function findUserByIdentifier(
  identifier: string,
): Promise<AuthUserRow | null> {
  const lowered = identifier.trim().toLowerCase();

  const result = await sql<AuthUserRow>(
    `
    SELECT
      "id",
      "username",
      "email",
      "passwordHash",
      "createdAt",
      "updatedAt",
      "name",
      "role",
      "joinedAt",
      "puid"
    FROM auth."User"
    WHERE lower("email") = $1
       OR lower("username") = $1
    LIMIT 1;
    `,
    [lowered],
  );

  return result.rows[0] ?? null;
}

async function findUserByPublicId(
  userId: string,
): Promise<AuthUserRow | null> {
  const result = await sql<AuthUserRow>(
    `
    SELECT
      "id",
      "username",
      "email",
      "passwordHash",
      "createdAt",
      "updatedAt",
      "name",
      "role",
      "joinedAt",
      "puid"
    FROM auth."User"
    WHERE "puid" = $1
       OR "id" = $1
    LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function searchUsers(
  query: string,
  excludeUserId?: string,
): Promise<AuthUserRow[]> {
  const searchTerm = `%${query.trim()}%`;

  // If excludeUserId is provided, we exclude rows where id or puid matches it
  const result = await sql<AuthUserRow>(
    `
    SELECT
      "id",
      "username",
      "email",
      "passwordHash",
      "createdAt",
      "updatedAt",
      "name",
      "role",
      "joinedAt",
      "puid"
    FROM auth."User"
    WHERE
      ($1 IS NULL OR ("puid" <> $1 AND "id" <> $1))
      AND (
        "username" ILIKE $2
        OR "name" ILIKE $2
      )
    ORDER BY "createdAt" ASC;
    `,
    [excludeUserId ?? null, searchTerm],
  );

  return result.rows;
}

// ---------------------------------------------------------------------------
// Login handler
// ---------------------------------------------------------------------------
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      const response: ApiResponse = {
        success: false,
        error: "Invalid request body",
      };
      return res.status(400).json(response);
    }

    const body = loginSchema.parse(req.body) as LoginRequest;
    const identifier = body.email.trim().toLowerCase();

    console.log("Login attempt:", { identifier, password: "***" });

    const foundUser = await findUserByIdentifier(identifier);

    console.log("User found:", foundUser ? "Yes" : "No");

    if (!foundUser) {
      console.log("User not found for:", identifier);
      const response: ApiResponse = {
        success: false,
        error: "Invalid email/username or password",
      };
      return res.status(401).json(response);
    }

    console.log("Verifying password with bcrypt...");
    const isPasswordValid = await bcrypt.compare(
      body.password,
      foundUser.passwordHash,
    );

    console.log("Password validation:", isPasswordValid);

    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid email/username or password",
      };
      return res.status(401).json(response);
    }

    const user = mapAuthUserToUserRow(foundUser);
    const token = createJwtForUser(user);

    console.log("Login successful for user:", user.username);

    const response: ApiResponse<{
      user: Omit<User, "password">;
      token: string;
    }> = {
      success: true,
      data: {
        user,
        token,
      },
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    console.error("Login error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    console.error("Raw login error:", error);

    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
    res.status(500).json(response);
  }
};

// ---------------------------------------------------------------------------
// Signup handler
// ---------------------------------------------------------------------------
export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const body = signupSchema.parse(req.body) as SignupRequest;

    const username = body.username.trim().toLowerCase();
    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();

    // Check if user already exists (email or username)
    const existing = await sql<Pick<AuthUserRow, "id" | "email" | "username">>(
      `
      SELECT "id", "email", "username"
      FROM auth."User"
      WHERE lower("email") = $1 OR lower("username") = $2
      LIMIT 1;
      `,
      [email, username],
    );

    const existingUser = existing.rows[0];

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email) {
        throw new Error("An account with this email already exists");
      } else {
        throw new Error("This username is already taken");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Generate internal id + public id
    const internalId = crypto.randomUUID();
    const puid = crypto.randomUUID();

    const created = await sql<AuthUserRow>(
      `
      INSERT INTO auth."User"
        ("id", "username", "email", "passwordHash", "name", "role", "createdAt", "updatedAt", "joinedAt", "puid")
      VALUES
        ($1, $2, $3, $4, $5, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6)
      RETURNING
        "id",
        "username",
        "email",
        "passwordHash",
        "createdAt",
        "updatedAt",
        "name",
        "role",
        "joinedAt",
        "puid";
      `,
      [internalId, username, email, hashedPassword, name, puid],
    );

    const createdUser = created.rows[0];

    const user = mapAuthUserToUserRow(createdUser);
    const token = createJwtForUser(user);

    const response: ApiResponse<{
      user: Omit<User, "password">;
      token: string;
    }> = {
      success: true,
      data: { user, token },
      message: "Account created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error,
    });

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

// ---------------------------------------------------------------------------
// Get current user profile (by public id or raw id)
// ---------------------------------------------------------------------------
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

    const authUser = await findUserByPublicId(userId);

    if (!authUser) {
      const response: ApiResponse = {
        success: false,
        error: "User not found",
      };
      return res.status(404).json(response);
    }

    const user = mapAuthUserToUserRow(authUser);

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

// ---------------------------------------------------------------------------
// Search users
// ---------------------------------------------------------------------------
export const handleSearchUsers: RequestHandler = async (req, res) => {
  try {
    const query = req.query.q as string;
    const excludeUserId = req.query.exclude as string | undefined;

    if (!query || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Search query is required",
      };
      return res.status(400).json(response);
    }

    const users = await searchUsers(query, excludeUserId);
    const mapped = users.map(mapAuthUserToUserRow);

    const response: ApiResponse<Omit<User, "password">[]> = {
      success: true,
      data: mapped,
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

// ---------------------------------------------------------------------------
// JWT verification middleware
// ---------------------------------------------------------------------------
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
    // @ts-expect-error - req.user is added at runtime
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

// ---------------------------------------------------------------------------
// Admin role verification middleware
// ---------------------------------------------------------------------------
export const requireAdmin: RequestHandler = (req, res, next) => {
  // @ts-expect-error - req.user is added at runtime
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: "Authentication required",
    };
    return res.status(401).json(response);
  }

  // @ts-expect-error - req.user is added at runtime
  if (req.user.role !== "admin") {
    const response: ApiResponse = {
      success: false,
      error: "Admin access required",
    };
    return res.status(403).json(response);
  }

  next();
};

// ---------------------------------------------------------------------------
// Reset password handler (admin only)
// ---------------------------------------------------------------------------
export const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body) as ResetPasswordRequest;

    const hashedPassword = await bcrypt.hash(body.newPassword, 12);

    const result = await sql<AuthUserRow>(
      `
      UPDATE auth."User"
      SET "passwordHash" = $1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "puid" = $2 OR "id" = $2
      RETURNING
        "id",
        "username",
        "email",
        "passwordHash",
        "createdAt",
        "updatedAt",
        "name",
        "role",
        "joinedAt",
        "puid";
      `,
      [hashedPassword, body.userId],
    );

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "User not found",
      };
      return res.status(404).json(response);
    }

    const user = mapAuthUserToUserRow(result.rows[0]);

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: user,
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

// ---------------------------------------------------------------------------
// Get all users (admin only)
// ---------------------------------------------------------------------------
export const handleGetAllUsers: RequestHandler = async (req, res) => {
  try {
    const result = await sql<AuthUserRow>(
      `
      SELECT
        "id",
        "username",
        "email",
        "passwordHash",
        "createdAt",
        "updatedAt",
        "name",
        "role",
        "joinedAt",
        "puid"
      FROM auth."User"
      ORDER BY "createdAt" ASC;
      `,
    );

    const mapped = result.rows.map(mapAuthUserToUserRow);

    const response: ApiResponse<Omit<User, "password">[]> = {
      success: true,
      data: mapped,
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

// ---------------------------------------------------------------------------
// Delete user (admin only)
// ---------------------------------------------------------------------------
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.userId; // can be id or puid

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      return res.status(400).json(response);
    }

    const result = await sql<AuthUserRow>(
      `
      DELETE FROM auth."User"
      WHERE "puid" = $1 OR "id" = $1
      RETURNING
        "id",
        "username",
        "email",
        "passwordHash",
        "createdAt",
        "updatedAt",
        "name",
        "role",
        "joinedAt",
        "puid";
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "User not found",
      };
      return res.status(404).json(response);
    }

    const user = mapAuthUserToUserRow(result.rows[0]);

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: user,
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
