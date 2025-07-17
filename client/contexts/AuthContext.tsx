import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatar?: string;
  joinedAt: string;
}

interface AuthError {
  type: "validation" | "network" | "server" | "auth";
  message: string;
  field?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: AuthError }>;
  signup: (
    username: string,
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  lastError: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE = "/api";

// API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("movienight_user");
    const storedToken = localStorage.getItem("movienight_token");
    const loginTime = localStorage.getItem("movienight_login_time");

    if (storedUser && storedToken) {
      try {
        // Check if session is still valid (optional: implement session timeout)
        const loginTimestamp = loginTime ? parseInt(loginTime) : 0;
        const now = Date.now();
        const sessionDuration = now - loginTimestamp;
        const maxSessionAge = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (sessionDuration < maxSessionAge) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          // Session expired, clear storage
          localStorage.removeItem("movienight_user");
          localStorage.removeItem("movienight_token");
          localStorage.removeItem("movienight_login_time");
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("movienight_user");
        localStorage.removeItem("movienight_token");
        localStorage.removeItem("movienight_login_time");
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = () => {
    setLastError(null);
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: AuthError }> => {
    setIsLoading(true);
    setLastError(null);

    // Client-side validation
    if (!email.trim()) {
      const error: AuthError = {
        type: "validation",
        message: "Email or username is required",
        field: "email",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result: ApiResponse<{ user: User; token: string }> =
        await response.json();

      if (!response.ok) {
        let error: AuthError;

        switch (response.status) {
          case 400:
            error = {
              type: "validation",
              message:
                result.error || "Invalid request. Please check your input.",
            };
            break;
          case 401:
            error = {
              type: "auth",
              message:
                "Invalid email/username or password. Please check your credentials and try again.",
            };
            break;
          case 403:
            error = {
              type: "auth",
              message:
                "Your account has been suspended. Please contact support.",
            };
            break;
          case 429:
            error = {
              type: "server",
              message:
                "Too many login attempts. Please wait a few minutes and try again.",
            };
            break;
          case 500:
            error = {
              type: "server",
              message: "Server error. Please try again later.",
            };
            break;
          default:
            error = {
              type: "server",
              message: `Login failed (${response.status}). Please try again later.`,
            };
        }

        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }

      if (result.success && result.data) {
        setUser(result.data.user);
        setToken(result.data.token);

        // Always store user and token for session persistence
        localStorage.setItem(
          "movienight_user",
          JSON.stringify(result.data.user),
        );
        localStorage.setItem("movienight_token", result.data.token);

        // Store login timestamp for better session management
        localStorage.setItem("movienight_login_time", Date.now().toString());

        setIsLoading(false);
        return { success: true };
      } else {
        const error: AuthError = {
          type: "auth",
          message:
            result.error ||
            "Login failed. Please check your credentials and try again.",
        };
        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      console.error("Login error details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      const authError: AuthError = {
        type: "network",
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
      };
      setLastError(authError);
      setIsLoading(false);
      return { success: false, error: authError };
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: AuthError }> => {
    setIsLoading(true);
    setLastError(null);

    // Client-side validation
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, name }),
      });

      const result: ApiResponse<{ user: User; token: string }> =
        await response.json();

      if (!response.ok) {
        let error: AuthError;

        switch (response.status) {
          case 400:
            error = {
              type: "validation",
              message:
                result.error || "Invalid input. Please check your information.",
            };
            break;
          case 409:
            error = {
              type: "validation",
              message:
                "Email or username already exists. Please choose a different one.",
            };
            break;
          case 429:
            error = {
              type: "server",
              message:
                "Too many signup attempts. Please wait a few minutes and try again.",
            };
            break;
          default:
            error = {
              type: "server",
              message: `Signup failed (${response.status}). Please try again later.`,
            };
        }

        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }

      if (result.success && result.data) {
        setUser(result.data.user);
        setToken(result.data.token);
        localStorage.setItem(
          "movienight_user",
          JSON.stringify(result.data.user),
        );
        localStorage.setItem("movienight_token", result.data.token);
        localStorage.setItem("movienight_login_time", Date.now().toString());
        setIsLoading(false);
        return { success: true };
      } else {
        const error: AuthError = {
          type: "server",
          message: result.error || "Signup failed. Please try again.",
        };
        setLastError(error);
        setIsLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      console.error("Signup error:", error);
      const authError: AuthError = {
        type: "network",
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
      };
      setLastError(authError);
      setIsLoading(false);
      return { success: false, error: authError };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    // Clear all auth-related localStorage items
    localStorage.removeItem("movienight_user");
    localStorage.removeItem("movienight_token");
    localStorage.removeItem("movienight_login_time");

    // Only clear remember me if user explicitly logs out
    // Keep remember_email and remember_me for next login
  };

  const isAdmin = user?.role === "admin";

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAdmin,
    lastError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
