"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// -----------------------------------------------------
// USER TYPE
// -----------------------------------------------------
export interface User {
  id: string; // PUID from backend
  username: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------
// ERROR TYPES
// -----------------------------------------------------
interface AuthError {
  type: "validation" | "network" | "server" | "auth";
  message: string;
  field?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: AuthError }>;
  signup: (
    username: string,
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  lastError: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------
// API BASE
// ----------------------
const API_BASE = "/api";

// ----------------------
// API RESPONSE
// ----------------------
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// -----------------------------------------------------
// AUTH PROVIDER
// -----------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  // -----------------------------------------------------
  // LOAD SESSION ON MOUNT
  // -----------------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      // We rely on httpOnly cookies, so just hit the endpoint
      try {
        // Verify with server
        const res = await fetch(`${API_BASE}/auth/me`);
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
             setUser(data.data);
             localStorage.setItem("movienight_user", JSON.stringify(data.data));
          } else {
             throw new Error("Invalid session");
          }
        } else {
           throw new Error("Session expired");
        }
      } catch (e) {
        // If server check fails, clear local user data
        try {
          localStorage.removeItem("movienight_user");
          localStorage.removeItem("movienight_token");
          localStorage.removeItem("movienight_login_time");
        } catch (storageError) {
          // localStorage might be unavailable in private browsing mode
          console.error("Failed to clear localStorage:", storageError);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const clearError = () => setLastError(null);

  // -----------------------------------------------------
  // LOGIN
  // -----------------------------------------------------
  const login = async (
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; error?: AuthError }> => {
    setIsLoading(true);
    setLastError(null);

    // --- Validation ---
    if (!emailOrUsername.trim()) {
      const error: AuthError = {
        type: "validation",
        message: "Email or username is required",
        field: "emailOrUsername",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!password) {
      const error: AuthError = {
        type: "validation",
        message: "Password is required",
        field: "password",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const result: ApiResponse<{ user: User }> =
        await response.json();

      if (!response.ok) {
        const error: AuthError =
          response.status === 401
            ? {
                type: "auth",
                message:
                  "Invalid email/username or password. Please try again.",
              }
            : {
                type: "server",
                message:
                  result.error ||
                  `Login failed (${response.status}). Please try again later.`,
              };

        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }

      // --- Successful login ---
      if (result.success && result.data) {
        const cleanUser = {
          ...result.data.user,
          username: result.data.user.username.toLowerCase(),
          email: result.data.user.email.toLowerCase(),
        };

        setUser(cleanUser);

        try {
          localStorage.setItem("movienight_user", JSON.stringify(cleanUser));
          localStorage.setItem("movienight_login_time", Date.now().toString());
        } catch (storageError) {
          console.error("Failed to save to localStorage:", storageError);
          // Continue anyway - user is authenticated via cookies
        }

        setIsLoading(false);
        return { success: true };
      }

      const error: AuthError = {
        type: "auth",
        message:
          result.error ||
          "Login failed. Please check your credentials and try again.",
      };

      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    } catch {
      const authError: AuthError = {
        type: "network",
        message:
          "Unable to connect to the server. Please check your internet connection.",
      };
      setLastError(authError);
      setIsLoading(false);
      return { success: false, error: authError };
    }
  };

  // -----------------------------------------------------
  // SIGNUP
  // -----------------------------------------------------
  const signup = async (
    username: string,
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: AuthError }> => {
    setIsLoading(true);
    setLastError(null);

    // --- Validation ---
    if (!name.trim()) {
      const error: AuthError = {
        type: "validation",
        message: "Full name is required",
        field: "name",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!username.trim()) {
      const error: AuthError = {
        type: "validation",
        message: "Username is required",
        field: "username",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const error: AuthError = {
        type: "validation",
        message: "Please enter a valid email address",
        field: "email",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (password.length < 6) {
      const error: AuthError = {
        type: "validation",
        message: "Password must be at least 6 characters long",
        field: "password",
      };
      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name }),
      });

      const result: ApiResponse<{ user: User }> =
        await response.json();

      if (!response.ok) {
        const error: AuthError =
          response.status === 409
            ? {
                type: "validation",
                message:
                  "Email or username already exists. Please choose a different one.",
              }
            : {
                type: "server",
                message:
                  result.error ||
                  `Signup failed (${response.status}). Please try again later.`,
              };

        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }

      if (result.success && result.data) {
        const cleanUser = {
          ...result.data.user,
          username: result.data.user.username.toLowerCase(),
          email: result.data.user.email.toLowerCase(),
        };

        setUser(cleanUser);

        localStorage.setItem("movienight_user", JSON.stringify(cleanUser));
        localStorage.setItem("movienight_login_time", Date.now().toString());

        setIsLoading(false);
        return { success: true };
      }

      const error: AuthError = {
        type: "server",
        message: result.error || "Signup failed. Please try again.",
      };

      setLastError(error);
      setIsLoading(false);
      return { success: false, error };
    } catch {
      const authError: AuthError = {
        type: "network",
        message:
          "Unable to connect to the server. Please check your internet connection.",
      };
      setLastError(authError);
      setIsLoading(false);
      return { success: false, error: authError };
    }
  };

  // -----------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("movienight_user");
    localStorage.removeItem("movienight_login_time");
    
    // Optional: Call logout API to delete session from DB
    fetch(`${API_BASE}/auth/logout`, { method: "POST" }).catch(console.error);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        isAdmin,
        lastError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
