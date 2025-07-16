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
  avatar?: string;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    username: string,
    email: string,
    password: string,
    name: string,
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database (in real app, this would be a backend API)
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    username: "ibrahim",
    email: "ibrahim@example.com",
    password: "password123",
    name: "Ibrahim Kaysar",
    joinedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    username: "omar",
    email: "omar@example.com",
    password: "password123",
    name: "Omar",
    joinedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    username: "sara",
    email: "sara@example.com",
    password: "password123",
    name: "Sara",
    joinedAt: "2024-01-03T00:00:00Z",
  },
  {
    id: "4",
    username: "alex",
    email: "alex@example.com",
    password: "password123",
    name: "Alex",
    joinedAt: "2024-01-04T00:00:00Z",
  },
  {
    id: "5",
    username: "maya",
    email: "maya@example.com",
    password: "password123",
    name: "Maya",
    joinedAt: "2024-01-05T00:00:00Z",
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("movienight_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("movienight_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const foundUser = MOCK_USERS.find(
      (u) =>
        (u.email === email || u.username === email) && u.password === password,
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem(
        "movienight_user",
        JSON.stringify(userWithoutPassword),
      );
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = MOCK_USERS.find(
      (u) => u.email === email || u.username === username,
    );

    if (existingUser) {
      setIsLoading(false);
      return false;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      name,
      joinedAt: new Date().toISOString(),
    };

    // In real app, this would be saved to backend
    MOCK_USERS.push({ ...newUser, password });

    setUser(newUser);
    localStorage.setItem("movienight_user", JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("movienight_user");
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
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
