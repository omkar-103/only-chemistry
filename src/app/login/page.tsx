"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, FlaskConical, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginInput } from "@/lib/validators/schemas";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ROUTES } from "@/constants";
import { signInWithPopup, signOut } from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";

interface DiagnosticInfo {
  stage: string;
  code?: string;
  message: string;
  backendReached: "YES" | "NO";
  idTokenObtained: "YES" | "NO";
  apiAuthGoogleReached: "YES" | "NO";
  backendStatus?: number | string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // ── Email / Password sign-in ──────────────────────────────────
  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/login", data);
      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        login(user, accessToken);
        toast({
          title: "Welcome back! 👋",
          description: `Logged in as ${user.name}`,
          variant: "success",
        });
        router.push(user.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.STUDENT.DASHBOARD);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      toast({ title: "Login Failed", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Sign-in ────────────────────────────────────────────
  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setDiagnostic(null);

    let stage = "Button clicked";
    let idTokenObtained: "YES" | "NO" = "NO";
    let apiAuthGoogleReached: "YES" | "NO" = "NO";
    let backendReached: "YES" | "NO" = "NO";

    console.log("[GOOGLE AUTH DEBUG] Button clicked");

    try {
      console.log("[GOOGLE AUTH DEBUG] Firebase initialized");
      console.log("[GOOGLE AUTH DEBUG] Google provider initialized");

      stage = "Starting signInWithPopup";
      console.log("[GOOGLE AUTH DEBUG] Starting signInWithPopup");

      const result = await signInWithPopup(firebaseAuth, googleProvider);
      console.log("[GOOGLE AUTH DEBUG] Firebase authentication successful");

      stage = "Getting Firebase ID token";
      console.log("[GOOGLE AUTH DEBUG] Getting Firebase ID token");

      const idToken = await result.user.getIdToken(true);
      idTokenObtained = "YES";

      stage = "Sending request to /api/auth/google";
      console.log("[GOOGLE AUTH DEBUG] Sending request to /api/auth/google");
      apiAuthGoogleReached = "YES";

      const response = await axios.post("/api/auth/google", { idToken });
      backendReached = "YES";

      console.log("[GOOGLE AUTH DEBUG] Backend response", response.status);

      if (response.data.success) {
        console.log("[GOOGLE AUTH DEBUG] Login successful");
        const { user, accessToken } = response.data.data;
        login(user, accessToken);
        toast({
          title: "Welcome back! 👋",
          description: `Signed in as ${user.name}`,
          variant: "success",
        });

        await signOut(firebaseAuth).catch(() => {});

        router.push(
          user.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.STUDENT.DASHBOARD
        );
      }
    } catch (error: any) {
      const errorCode = error?.code || error?.response?.data?.code || "UNKNOWN";
      const errorMessage = error?.response?.data?.message || error?.message || "An error occurred";
      const status = error?.response?.status;

      console.error("[GOOGLE AUTH ERROR]");
      console.error("Stage:", stage);
      console.error("Code:", errorCode);
      console.error("Message:", errorMessage);

      // User closed popup or cancelled
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request" ||
        error?.code === "auth/user-cancelled"
      ) {
        setIsGoogleLoading(false);
        return;
      }

      if (error?.code === "auth/popup-blocked") {
        toast({
          title: "Popup Blocked",
          description: "Please enable popups for this site to sign in with Google.",
          variant: "error",
        });
        setIsGoogleLoading(false);
        return;
      }

      // No MongoDB account found -> show message and redirect to register
      if (status === 404) {
        toast({
          title: "No account found",
          description: "No account found. Please register first.",
          variant: "error",
        });
        router.push(ROUTES.REGISTER);
        setIsGoogleLoading(false);
        return;
      }

      // Set diagnostic panel for development inspection
      setDiagnostic({
        stage,
        code: errorCode,
        message: errorMessage,
        backendReached: status ? "YES" : backendReached,
        idTokenObtained,
        apiAuthGoogleReached,
        backendStatus: status || "N/A",
      });

      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 text-white/5 text-[120px] font-display font-black select-none">CH₄</div>
        </div>
        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <FlaskConical className="h-12 w-12 text-gold-400" />
            <span className="font-display font-black text-3xl text-white">
              Only<span className="text-gold-400">Chemistry</span>
            </span>
          </div>
          <h1 className="text-4xl font-display font-black text-white mb-4">
            Welcome Back!
          </h1>
          <p className="text-white/70 text-lg max-w-sm leading-relaxed">
            Continue your chemistry journey. Access your exams, results, and learning resources.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { v: "10K+", l: "Students" },
              { v: "500+", l: "Exams" },
              { v: "98%", l: "Success" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-black text-gold-400">{s.v}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <FlaskConical className="h-8 w-8 text-primary" />
            <span className="font-display font-black text-xl">Only Chemistry</span>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-black text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">
              Don&apos;t have an account?{" "}
              <Link href={ROUTES.REGISTER} className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Diagnostic Panel (shown if error occurs in development) */}
          {diagnostic && (
            <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-xs space-y-1.5 relative">
              <button
                onClick={() => setDiagnostic(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 font-bold text-destructive text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Google Sign-In Diagnostic</span>
              </div>
              <div><span className="font-semibold text-muted-foreground">Stage:</span> <span className="font-mono">{diagnostic.stage}</span></div>
              {diagnostic.code && <div><span className="font-semibold text-muted-foreground">Error Code:</span> <span className="font-mono text-destructive">{diagnostic.code}</span></div>}
              <div><span className="font-semibold text-muted-foreground">Message:</span> <span>{diagnostic.message}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-1 mt-1 border-t border-destructive/20">
                <div><span className="font-semibold text-muted-foreground">ID Token Obtained:</span> <span className="font-mono">{diagnostic.idTokenObtained}</span></div>
                <div><span className="font-semibold text-muted-foreground">API Reached:</span> <span className="font-mono">{diagnostic.apiAuthGoogleReached}</span></div>
                <div><span className="font-semibold text-muted-foreground">Backend Reached:</span> <span className="font-mono">{diagnostic.backendReached}</span></div>
                <div><span className="font-semibold text-muted-foreground">HTTP Status:</span> <span className="font-mono">{diagnostic.backendStatus}</span></div>
              </div>
            </div>
          )}

          {/* Registration success banner */}
          {registered && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Account created! You can now log in.
              </p>
            </div>
          )}

          {/* ── Email / Password form ──────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              required
              {...register("email")}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              required
              {...register("password")}
            />

            <div className="flex items-center justify-end">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              isLoading={isLoading}
              loadingText="Signing in..."
              className="w-full"
              id="login-submit"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* ── OR divider ─────────────────────────────────────── */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Continue with Google ───────────────────────────── */}
          <button
            type="button"
            id="google-signin"
            onClick={onGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-card hover:bg-muted/60 transition-all duration-200 font-semibold text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                <span>Connecting to Google…</span>
              </>
            ) : (
              <>
                {/* Official Google "G" logo SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="group-hover:text-foreground transition-colors">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Security info */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              🔒 Secured with JWT authentication. Your data is protected with industry-standard encryption.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
