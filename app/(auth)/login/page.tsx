"use client";

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight, Film } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.emailOrUsername || !formData.password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(formData.emailOrUsername, formData.password);
      if (success) {
        router.push("/");
      } else {
        setError("Invalid email/username or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative w-full overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0D0D] via-[#1a1a2e] to-[#0f0f1e]" />

        {/* Glowing orbs */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-15" />

        {/* Subtle film strip pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px)",
              backgroundSize: "100% 100%",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo Section */}
        <div className="mb-12 text-center">
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center justify-center w-full hover:opacity-80 transition-opacity active:scale-95"
          >
            <div className="flex justify-center mb-6">
              <Film size={48} className="text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
              MovieNight
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover, watch, and connect
            </p>
          </button>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] border border-primary/20 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm space-y-2">
                <p className="font-semibold">{error}</p>
                {error.includes("Database") && (
                  <p className="text-xs opacity-75">
                    💡 Tip: Check that PostgreSQL is running. In Docker, make
                    sure the database service is accessible.
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Email or Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <Mail
                      size={18}
                      className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="user@example.com or username"
                      value={formData.emailOrUsername}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailOrUsername: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <Lock
                      size={18}
                      className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors"
                    />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg hover:from-primary hover:to-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:shadow-primary/60 group transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] text-muted-foreground text-sm">
                  New to MovieNight?
                </span>
              </div>
            </div>

            {/* Signup Link */}
            <Link
              href="/signup"
              className="w-full py-3 px-4 rounded-xl border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all font-bold text-center block"
            >
              Create an Account
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-muted-foreground text-sm mt-8">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
