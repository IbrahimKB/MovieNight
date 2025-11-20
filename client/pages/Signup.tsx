import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Film, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState("");

  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation logic
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    else if (formData.username.trim().length < 3)
      errors.username = "Username must be at least 3 characters";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      errors.email = "Please enter a valid email address";

    if (!formData.password || formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    if (!validateForm()) {
      setTimeout(() => errorRef.current?.focus(), 50);
      return;
    }

    const result = await signup(
      formData.username.toLowerCase(),
      formData.email.toLowerCase(),
      formData.password,
      formData.name.trim()
    );

    if (result.success) {
      navigate("/");
    } else if (result.error) {
      if (result.error.field) {
        setFieldErrors({ [result.error.field]: result.error.message });
      } else {
        setGeneralError(result.error.message);
      }

      setTimeout(() => errorRef.current?.focus(), 50);
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
        {/* Logo */}
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
              {(generalError || Object.keys(fieldErrors).length > 0) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription tabIndex={-1} ref={errorRef}>
                    {generalError && <div>{generalError}</div>}
                    {Object.values(fieldErrors).map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Full Name */}
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="name" className="text-responsive-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Username */}
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
                />
              </div>

              {/* Email */}
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
                />
              </div>

              {/* Password */}
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
                    className="pr-12"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 w-12"
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
                  </div>
                )}
              </div>

              {/* Confirm Password */}
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
                    className="pr-12"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 w-12"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>

                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <Check className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium animate-press"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
                className="text-responsive-sm text-primary hover:underline font-medium"
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
