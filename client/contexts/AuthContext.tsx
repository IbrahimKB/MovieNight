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

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    username: string,
    email: string,
    password: string,
    name: string,
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.error(
          "Login response not ok:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setIsLoading(false);
        return false;
      }

      const result: ApiResponse<{ user: User; token: string }> =
        await response.json();

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
        return true;
      } else {
        console.error("Login failed:", result.error);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Login error details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, name }),
      });

      if (!response.ok) {
        console.error(
          "Signup response not ok:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setIsLoading(false);
        return false;
      }

      const result: ApiResponse<{ user: User; token: string }> =
        await response.json();

      if (result.success && result.data) {
        setUser(result.data.user);
        setToken(result.data.token);
        localStorage.setItem(
          "movienight_user",
          JSON.stringify(result.data.user),
        );
        localStorage.setItem("movienight_token", result.data.token);
        setIsLoading(false);
        return true;
      } else {
        console.error("Signup failed:", result.error);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
      return false;
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
