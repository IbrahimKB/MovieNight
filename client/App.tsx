import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Suggest from "./pages/Suggest";
import MovieNight from "./pages/MovieNight";
import Watchlist from "./pages/Watchlist";
import Squad from "./pages/Squad";
import AdminDashboard from "./pages/AdminDashboard";

import Releases from "./pages/Releases";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

// Set dark mode by default
document.documentElement.classList.add("dark");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suggest"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suggest />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/releases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Releases />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/movie-night"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MovieNight />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Watchlist />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Squad />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/squad"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Squad />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
