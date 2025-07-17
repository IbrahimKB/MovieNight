import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Film, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.name ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return "Please fill in all fields";
    }

    if (formData.username.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const success = await signup(
      formData.username,
      formData.email,
      formData.password,
      formData.name,
    );

    if (success) {
      navigate("/");
    } else {
      setError("Username or email already exists");
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
            Join the community and start planning movie nights with friends
          </p>
        </div>

        {/* Signup Form */}
        <Card className="mobile-card border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-responsive-lg text-center">
              Create Account
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
                  htmlFor="name"
                  className="text-responsive-sm font-medium"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  className="input-mobile h-12 text-base"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="username"
                  className="text-responsive-sm font-medium"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  disabled={isLoading}
                  autoComplete="username"
                  className="input-mobile h-12 text-base"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="email"
                  className="text-responsive-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
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
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    disabled={isLoading}
                    autoComplete="new-password"
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
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            passwordStrength >= level
                              ? level <= 2
                                ? "bg-red-500"
                                : level === 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength === 0 && "Password too weak"}
                      {passwordStrength === 1 && "Weak password"}
                      {passwordStrength === 2 && "Fair password"}
                      {passwordStrength === 3 && "Good password"}
                      {passwordStrength === 4 && "Strong password"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label
                  htmlFor="confirmPassword"
                  className="text-responsive-sm font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="input-mobile h-12 text-base pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="btn-touch absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <Check className="absolute right-12 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                </div>
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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <span className="text-responsive-sm text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-responsive-sm text-primary hover:underline font-medium btn-touch inline-block py-1 px-1 animate-press-sm"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
