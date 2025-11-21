import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Film, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { login, isLoading, lastError, clearError } = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Load saved credentials if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("movienight_remember_email");
    const savedRemember = localStorage.getItem("movienight_remember_me");

    if (savedEmail && savedRemember === "true") {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateFields = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email or username is required";
    } else if (
      email.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    clearError();

    if (!validateFields()) {
      if (fieldErrors.email && emailRef.current) {
        emailRef.current.focus();
      }
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.focus();
        }
      }, 100);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // Remember me
      if (rememberMe) {
        localStorage.setItem("movienight_remember_email", email);
        localStorage.setItem("movienight_remember_me", "true");
      } else {
        localStorage.removeItem("movienight_remember_email");
        localStorage.removeItem("movienight_remember_me");
      }

      // Read stored user from AuthContext
      const storedUserStr = localStorage.getItem("movienight_user");
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

      if (storedUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else if (result.error) {
      if (result.error.field) {
        setFieldErrors({ [result.error.field]: result.error.message });
      } else {
        setError(result.error.message);
      }

      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo/Brand */}
        <header className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <Film className="h-8 w-8 sm:h-10 sm:w-10 text-primary" aria-hidden="true" />
            <h1 className="text-responsive-xl font-bold">MovieNight</h1>
          </div>
          <p className="text-responsive-sm text-muted-foreground px-2">
            Sign in to discover and plan movie nights with friends
          </p>
        </header>

        {/* Login Form */}
        <Card className="mobile-card border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-responsive-lg text-center" id="login-title">
              Welcome Back
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5"
              noValidate
              aria-labelledby="login-title"
              id="main-content"
            >
              {(error || lastError || Object.keys(fieldErrors).length > 0) && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription ref={errorRef} tabIndex={-1}>
                    {(error || lastError?.message) && (
                      <div className="font-medium">{error || lastError?.message}</div>
                    )}
                    {fieldErrors.email && <div>{fieldErrors.email}</div>}
                    {fieldErrors.password && <div>{fieldErrors.password}</div>}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="email"
                  className="text-responsive-sm font-medium block"
                >
                  Email or Username *
                </label>
                <Input
                  ref={emailRef}
                  id="email"
                  type="text"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  className="input-mobile h-12 text-base"
                  aria-required="true"
                  aria-invalid={fieldErrors.email ? "true" : "false"}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
                {fieldErrors.email && (
                  <div id="email-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="password"
                  className="text-responsive-sm font-medium block"
                >
                  Password *
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
                    aria-required="true"
                    aria-invalid={fieldErrors.password ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : "password-toggle-desc"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="btn-touch absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    aria-describedby="password-toggle-desc"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                  <div id="password-toggle-desc" className="sr-only">
                    Toggle password visibility
                  </div>
                </div>
                {fieldErrors.password && (
                  <div id="password-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.password}
                  </div>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center space-x-3 py-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  className="h-5 w-5"
                  aria-describedby="remember-me-desc"
                />
                <label
                  htmlFor="remember-me"
                  className="text-responsive-sm font-medium leading-none cursor-pointer"
                >
                  Remember me
                </label>
                <div id="remember-me-desc" className="sr-only">
                  Keep me logged in on this device
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full btn-touch h-12 text-base font-medium animate-press"
                disabled={isLoading}
                size="lg"
                aria-describedby="submit-desc"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                    <span className="sr-only">Please wait while we sign you in</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div id="submit-desc" className="sr-only">
                Submit the login form to access your MovieNight account
              </div>
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
