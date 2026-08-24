"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, FlaskConical, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginInput } from "@/lib/validators/schemas";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ROUTES } from "@/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

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
        // Redirect based on role
        router.push(user.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.STUDENT.DASHBOARD);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      toast({ title: "Login Failed", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
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

          {/* Registration success banner */}
          {registered && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Account created! You can now log in.
              </p>
            </div>
          )}
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
