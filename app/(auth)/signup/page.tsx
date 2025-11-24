"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, ArrowRight, Clapperboard } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signup(
        formData.username,
        formData.email,
        formData.password,
        formData.name
      );

      if (!result.success) {
        setError(result.error?.message || "Signup failed");
        return;
      }

      router.push("/");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
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
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px)',
            backgroundSize: '100% 100%'
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo Section */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/50">
              <Clapperboard size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            MovieNight
          </h1>
          <p className="text-muted-foreground text-lg">Discover, watch, and connect</p>
        </div>

        {/* Signup Card */}
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] border border-primary/20 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-muted-foreground">Join millions of movie enthusiasts</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                      minLength={3}
                    />
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0a0a14] border border-primary/30 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg hover:from-primary hover:to-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:shadow-primary/60 group transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
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
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all font-bold text-center block"
            >
              Sign In
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-muted-foreground text-sm mt-8">
            By signing up, you agree to our{" "}
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
