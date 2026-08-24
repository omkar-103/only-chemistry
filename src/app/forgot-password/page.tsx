"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ROUTES } from "@/constants";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const emailForm = useForm<{ email: string }>();
  const resetForm = useForm<{ otp: string; password: string; confirmPassword: string }>();

  const onRequestOTP = async (data: { email: string }) => {
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email: data.email });
      setEmail(data.email);
      setStep("otp");
      toast({ title: "OTP Sent", description: "Check your email (or console in dev mode)", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to send OTP", variant: "error" });
    } finally { setLoading(false); }
  };

  const onResetPassword = async (data: { otp: string; password: string; confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { email, otp: data.otp, password: data.password, confirmPassword: data.confirmPassword });
      toast({ title: "Password Reset!", description: "You can now log in with your new password", variant: "success" });
      router.push(ROUTES.LOGIN);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Reset failed", variant: "error" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link href={ROUTES.LOGIN} className="text-sm text-primary hover:underline">
            Back to Login
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-black text-foreground">
            {step === "email" ? "Forgot Password?" : "Reset Password"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === "email"
              ? "Enter your email to receive a password reset OTP."
              : `Enter the OTP sent to ${email} and set your new password.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={emailForm.handleSubmit(onRequestOTP)} className="space-y-5" id="forgot-form">
            <Input
              id="forgot-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={emailForm.formState.errors.email?.message}
              required
              {...emailForm.register("email", { required: "Email is required" })}
            />
            <Button type="submit" variant="gold" size="lg" isLoading={loading} loadingText="Sending..." className="w-full" id="send-otp">
              Send Reset OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5" id="reset-form">
            <Input
              id="reset-otp"
              label="OTP Code"
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              required
              {...resetForm.register("otp", { required: true })}
            />
            <Input
              id="new-password"
              label="New Password"
              type={showPw ? "text" : "password"}
              placeholder="Min 8 chars"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              {...resetForm.register("password", { required: true })}
            />
            <Input
              id="confirm-password"
              label="Confirm New Password"
              type={showPw ? "text" : "password"}
              placeholder="Repeat password"
              leftIcon={<Lock className="h-4 w-4" />}
              required
              {...resetForm.register("confirmPassword", { required: true })}
            />
            <Button type="submit" variant="gold" size="lg" isLoading={loading} loadingText="Resetting..." className="w-full" id="reset-submit">
              Reset Password
            </Button>
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setStep("email")}>
              ← Request New OTP
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
