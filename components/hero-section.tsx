"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  ArrowRight,
  Play,
  Search,
  Users,
  Star,
  Zap,
  Share2,
  Calendar,
  BarChart3,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function HeroSection() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: Search,
      title: "Smart Discovery",
      description:
        "Search millions of movies, filter by genre, rating, and year. Discover trending films and get personalized recommendations.",
    },
    {
      icon: Users,
      title: "Social Watchlist",
      description:
        "Share your watchlist with friends, see what they're watching, and suggest movies to each other.",
    },
    {
      icon: Star,
      title: "Rate & Review",
      description:
        "Rate movies, write reviews, see friend ratings and recommendations. Build your personal movie database.",
    },
    {
      icon: Calendar,
      title: "Movie Nights",
      description:
        "Schedule group watch parties, coordinate viewing with friends, and never miss a movie night.",
    },
    {
      icon: BarChart3,
      title: "Your Stats",
      description:
        "Track movies watched, see your viewing trends, and get year-in-review statistics.",
    },
    {
      icon: Share2,
      title: "Share & Connect",
      description:
        "Share recommendations on social media, invite friends, and build your movie community.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Sign Up",
      description: "Create your account in seconds",
    },
    {
      number: "2",
      title: "Build Watchlist",
      description: "Add movies you want to watch",
    },
    {
      number: "3",
      title: "Share & Connect",
      description: "Share with friends, suggest picks",
    },
    {
      number: "4",
      title: "Watch Together",
      description: "Schedule watch parties together",
    },
  ];

  const stats = [
    { value: "50K+", label: "Movie Database" },
    { value: "10K+", label: "Active Users" },
    { value: "100K+", label: "Recommendations" },
    { value: "500K+", label: "Hours Watched" },
  ];

  const testimonials = [
    {
      quote:
        "Finally a way to coordinate movies with my squad! No more 'what do you want to watch?' debates.",
      author: "Sarah",
      role: "Movie Enthusiast",
    },
    {
      quote:
        "The recommendations from my friends are way better than any algorithm. Love it!",
      author: "Mike",
      role: "Cinema Lover",
    },
    {
      quote:
        "Perfect for planning movie nights. We love seeing what everyone's into.",
      author: "Lisa",
      role: "Social Coordinator",
    },
  ];

  const faqs = [
    {
      question: "Is MovieNight free?",
      answer:
        "Yes! MovieNight is free to use. Create an account, build your watchlist, and start sharing with friends immediately. Premium features coming soon.",
    },
    {
      question: "How do I share my watchlist?",
      answer:
        "Go to your watchlist and use the share button to send it to friends via link, or invite specific friends from your network.",
    },
    {
      question: "Can I schedule watch parties?",
      answer:
        "Yes! Create a movie night event, invite friends, set a date and time, and coordinate viewing together. You can even add notes and discussions.",
    },
    {
      question: "What devices can I use?",
      answer:
        "MovieNight works on all modern browsers on desktop, tablet, and mobile. We're optimized for all screen sizes.",
    },
    {
      question: "How do recommendations work?",
      answer:
        "Get recommendations based on movies you've rated, your favorite genres, and what your friends are watching. The more you rate, the better the recommendations.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D] via-[#0A0A0A] to-[#111111]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-15" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-primary/10 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <BrandLogo size="lg" className="text-white" />
            <span className="text-xl font-black text-white hidden sm:inline">
              MovieNight
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-1 items-center">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              FAQ
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-3 items-center">
            <button
              onClick={() => router.push("/login")}
              className="hidden sm:block text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 sm:px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Sign Up
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-all"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-white" />
              ) : (
                <Menu size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              <a
                href="#features"
                className="block text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
              >
                How It Works
              </a>
              <a
                href="#faq"
                className="block text-sm text-muted-foreground hover:text-white px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
              >
                FAQ
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 sm:py-20">
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-sm font-semibold text-primary">
              ✨ Discover. Watch. Connect.
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
            <span>Your Movies.</span>
            <br />
            <span>Your Friends.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Your Night.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12">
            Create your watchlist, share recommendations with friends, and
            discover movies together. MovieNight is your personal movie
            community.
          </p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => {
                console.log("HeroSection: Navigate to /signup");
                router.push("/signup");
              }}
              className="group relative px-8 sm:px-12 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:shadow-primary/60"
            >
              <div className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Get Started Free
                <ArrowRight size={20} />
              </span>
            </button>

            <button
              onClick={() => {
                console.log("HeroSection: Navigate to /login");
                router.push("/login");
              }}
              className="px-8 sm:px-12 py-3 sm:py-4 rounded-xl border border-primary/50 text-white hover:bg-primary/10 hover:border-primary/80 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Explore Movies
            </button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <ChevronDown size={24} className="text-primary/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 py-16 sm:py-20 lg:py-28 px-4"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to discover, share, and enjoy movies with
              friends
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-all">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 py-16 sm:py-20 lg:py-28 px-4"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Get Started in 4 Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start discovering and sharing movies with friends today
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                    {step.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={24} className="text-primary/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 py-16 sm:py-20 lg:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 text-center hover:border-primary/50 transition-all"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white text-center mb-8 sm:mb-12">
              What Users Say
            </h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground italic mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">
                      {testimonial.author}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-16 sm:py-20 lg:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about MovieNight
            </p>
          </motion.div>

          {/* FAQs */}
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl overflow-hidden hover:border-primary/50 transition-all"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-primary/5 transition-all"
                >
                  <span className="font-semibold text-white text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-primary transition-transform duration-300 flex-shrink-0 ml-4 ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="px-6 sm:px-8 py-4 sm:py-5 border-t border-primary/20 bg-primary/5"
                  >
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-16 sm:py-20 lg:py-28 px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Ready to discover movies differently?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8">
            Join thousands of movie lovers discovering great films together
          </p>

          <button
            onClick={() => router.push("/signup")}
            className="group relative px-10 sm:px-14 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto shadow-lg shadow-primary/40 hover:shadow-primary/60"
          >
            <div className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              Start Free Today
              <ArrowRight size={20} />
            </span>
          </button>

          <p className="text-xs sm:text-sm text-muted-foreground mt-4">
            No credit card required. Free forever.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 bg-background/50 backdrop-blur-sm py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo size="md" className="text-primary" />
                <span className="font-black text-white">MovieNight</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Discover, watch, and connect with your movie community.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-primary transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Download
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-primary transition-colors">
                    About
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-primary transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors">
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-primary/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 MovieNight. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-primary transition-colors">
                Twitter
              </button>
              <button className="hover:text-primary transition-colors">
                GitHub
              </button>
              <button className="hover:text-primary transition-colors">
                Discord
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
