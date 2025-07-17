import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Film, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("movienight_remember_email");
    const savedRemember = localStorage.getItem("movienight_remember_me");

    if (savedEmail && savedRemember === "true") {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const success = await login(email, password);
    if (success) {
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("movienight_remember_email", email);
        localStorage.setItem("movienight_remember_me", "true");
      } else {
        localStorage.removeItem("movienight_remember_email");
        localStorage.removeItem("movienight_remember_me");
      }

      // Check if we should redirect to admin after login
      if (email === "admin@movienight.co.uk" || email === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setError("Invalid email/username or password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <Film className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-responsive-xl font-bold">MovieNight</h1>
          </div>
          <p className="text-responsive-sm text-muted-foreground px-2">
            Sign in to discover and plan movie nights with friends
          </p>
        </div>

        {/* Login Form */}
        <Card className="mobile-card border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-responsive-lg text-center">
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="email"
                  className="text-responsive-sm font-medium"
                >
                  Email or Username
                </label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  className="input-mobile h-12 text-base"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="password"
                  className="text-responsive-sm font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="input-mobile h-12 text-base pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="btn-touch absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  disabled={isLoading}
                  className="h-5 w-5"
                />
                <label
                  htmlFor="remember-me"
                  className="text-responsive-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full btn-touch h-12 text-base font-medium animate-press"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <span className="text-responsive-sm text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-responsive-sm text-primary hover:underline font-medium btn-touch inline-block py-1 px-1 animate-press-sm"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
