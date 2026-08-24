"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { otpVerifySchema, OTPVerifyInput } from "@/lib/validators/schemas";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { ROUTES } from "@/constants";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);

  const otpForm = useForm<OTPVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
  });

  const onVerifyOTP = async (data: OTPVerifyInput) => {
    if (!email) {
      toast({ title: "Email required", description: "Please provide your email address", variant: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp", {
        email,
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

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black text-foreground">Verify Your Email</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter the 6-digit verification OTP sent to your email.
          </p>
        </div>

        <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4" id="verify-email-form">
          {!initialEmail && (
            <Input
              id="verify-email-input"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
          )}

          <Input
            id="otp"
            label="Enter 6-Digit OTP"
            type="text"
            placeholder="••••••"
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
            id="verify-submit"
          >
            Verify Email
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
