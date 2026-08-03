"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, FlaskConical, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, RegisterInput } from "@/lib/validators/schemas";
import { otpVerifySchema, OTPVerifyInput } from "@/lib/validators/schemas";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ROUTES } from "@/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "otp">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", mobile: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm<OTPVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
  });

  const onRegister = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/register", data);
      if (response.data.success) {
        // Dev mode: server auto-verifies → go straight to login
        if (response.data.data?.autoVerified) {
          toast({
            title: "Registration Successful! 🎉",
            description: "Your account is ready. You can log in now!",
            variant: "success",
          });
          router.push(`${ROUTES.LOGIN}?registered=1`);
          return;
        }
        // Production: show OTP verification step
        setRegisteredEmail(data.email);
        setStep("otp");
        toast({
          title: "OTP Sent! ✉️",
          description: "Check your email for the 6-digit verification code.",
          variant: "success",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async (data: OTPVerifyInput) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp", {
        email: registeredEmail,
        otp: data.otp,
      });
      if (response.data.success) {
        toast({
          title: "Email Verified! 🎉",
          description: "Your account is ready. Please log in.",
          variant: "success",
        });
        router.push(ROUTES.LOGIN);
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid OTP. Please try again.",
        variant: "error",
      });
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
          <div className="absolute top-20 right-8 text-white/5 text-[100px] font-display font-black select-none">NaCl</div>
          <div className="absolute bottom-20 left-8 text-white/5 text-[80px] font-display font-black select-none">C₆H₁₂O₆</div>
        </div>
        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <FlaskConical className="h-12 w-12 text-gold-400" />
            <span className="font-display font-black text-3xl text-white">
              RHG<span className="text-gold-400">CS</span>
            </span>
          </div>
          <h1 className="text-4xl font-display font-black text-white mb-4">
            Join the Community
          </h1>
          <p className="text-white/70 text-lg max-w-sm leading-relaxed">
            Start your chemistry exam preparation with India&apos;s most comprehensive online examination platform.
          </p>
          {/* Benefits list */}
          <div className="mt-8 space-y-3 text-left">
            {[
              "Free and paid exam access",
              "Personalized doubt resolution",
              "Category-wise learning videos",
              "Detailed performance analytics",
              "Expert-curated question bank",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-gold-400 shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <FlaskConical className="h-7 w-7 text-primary" />
            <span className="font-display font-black text-lg">RHGConsultancyService</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-3xl font-display font-black text-foreground">Create Account</h2>
                  <p className="text-muted-foreground mt-2">
                    Already have one?{" "}
                    <Link href={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" id="register-form">
                  <Input
                    id="name"
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    leftIcon={<User className="h-4 w-4" />}
                    error={registerForm.formState.errors.name?.message}
                    required
                    {...registerForm.register("name")}
                  />
                  <Input
                    id="reg-email"
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={registerForm.formState.errors.email?.message}
                    required
                    {...registerForm.register("email")}
                  />
                  <Input
                    id="mobile"
                    label="Mobile Number"
                    type="tel"
                    placeholder="9876543210"
                    leftIcon={<Phone className="h-4 w-4" />}
                    hint="10-digit Indian mobile number"
                    error={registerForm.formState.errors.mobile?.message}
                    required
                    {...registerForm.register("mobile")}
                  />
                  <Input
                    id="reg-password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, uppercase, number, special char"
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={registerForm.formState.errors.password?.message}
                    required
                    {...registerForm.register("password")}
                  />
                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={registerForm.formState.errors.confirmPassword?.message}
                    required
                    {...registerForm.register("confirmPassword")}
                  />

                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="#" className="text-primary hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                  </p>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    className="w-full"
                    id="register-submit"
                  >
                    Create Account
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-black text-foreground">Verify Your Email</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    We sent a 6-digit OTP to <span className="font-medium text-foreground">{registeredEmail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 In dev mode, check your terminal/console for the OTP
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-5" id="otp-form">
                  <Input
                    id="otp"
                    label="Enter OTP"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    error={otpForm.formState.errors.otp?.message}
                    required
                    {...otpForm.register("otp")}
                  />

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Verifying..."
                    className="w-full"
                    id="otp-submit"
                  >
                    Verify Email
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setStep("register")}
                  >
                    ← Back to Registration
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
