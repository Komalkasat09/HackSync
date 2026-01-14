"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { Toast } from "@/components/Toast";
import { API_ENDPOINTS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { signInWithGoogle } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "loading" | "warning"; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false,
  });
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(API_ENDPOINTS.AUTH.ME, {
          headers: { 
            "Authorization": `Bearer ${token}` 
          },
        });
        
        if (res.ok) {
          // Already logged in, redirect to dashboard
          router.push("/dashboard");
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("token");
        }
      } catch {
        // Error checking token, remove it
        localStorage.removeItem("token");
      }
    };

    checkAuth();
  }, [router]);

  const showToast = (message: string, type: "success" | "error" | "info" | "loading" | "warning" = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName || !email || !password || !confirmPass) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (fullName.trim().length < 2) {
      showToast("Full name must be at least 2 characters long", "error");
      return;
    }

    if (password !== confirmPass) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    if (!acceptedTerms) {
      showToast("Please accept the Terms of Use and Privacy Policy", "warning");
      return;
    }

    setLoading(true);
    showToast("Creating your account...", "loading");
    
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        hideToast();
        showToast("Account created successfully! Redirecting to login...", "success");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        hideToast();
        const errorMessage = data.detail || "Signup failed";
        
        if (errorMessage.toLowerCase().includes("already registered") || errorMessage.toLowerCase().includes("email already")) {
          showToast("Email already registered. Please login instead.", "warning");
        } else if (errorMessage.toLowerCase().includes("password") && errorMessage.toLowerCase().includes("long")) {
          showToast("Password is too long (maximum 72 characters)", "error");
        } else if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("invalid")) {
          showToast("Invalid email address", "error");
        } else {
          showToast(errorMessage, "error");
        }
      }
    } catch {
      hideToast();
      showToast("Server error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      showToast("Redirecting to Google...", "loading");
      await signInWithGoogle();
    } catch (error) {
      hideToast();
      console.error("Google sign-in error:", error);
      showToast("Failed to sign in with Google. Please try again.", "error");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background transition-colors">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={toast.type === "loading" ? 0 : 3000}
      />
      
      {/* BACK BUTTON (Top Left) */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Link>

      {/* THEME TOGGLE */}
      <div className="absolute top-8 right-8">
        <ModeToggle />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create account</h1>
        <p className="text-foreground/60 text-sm mt-2">Start detecting AI content today</p>
      </div>

      {/* THE BOX (Structured Card) */}
      <div className="auth-card relative overflow-hidden">
        {/* Gray gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/10 pointer-events-none rounded-2xl" />
        <div className="relative z-10">
        <button 
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          type="button"
          className="btn-google mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-.76-.15-1.81-.15-1.81Z"/>
            </svg>
          )}
          {googleLoading ? "Redirecting..." : "Sign up with Google"}
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-card-border w-full"></div>
          <span className="bg-card px-3 text-xs text-foreground/50 uppercase absolute font-semibold">Or continue with</span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground/70 mb-1.5">FULL NAME</label>
            <input 
              type="text" 
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/70 mb-1.5">EMAIL</label>
            <input 
              type="email" 
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/70 mb-1.5">PASSWORD</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/70 mb-1.5">CONFIRM PASSWORD</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-4">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 rounded border-card-border accent-foreground" 
              required 
            />
            <p className="text-xs text-foreground/60 leading-tight">
               I accept the <a href="#" className="text-foreground hover:underline">Terms of Use</a> and <a href="#" className="text-foreground hover:underline">Privacy Policy</a>
            </p>
          </div>

          <button 
            disabled={loading || !acceptedTerms} 
            className={cn(
              "w-full bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2",
              (!acceptedTerms || loading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-foreground/60">
          Already have an account? <Link href="/auth/login" className="text-foreground font-semibold hover:underline ml-1">Login</Link>
        </div>
        </div>
      </div>
    </div>
  );
}