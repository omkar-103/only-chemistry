// ============================================================
// Zod Validation Schemas
// ============================================================

import { z } from "zod";

// ── Auth Schemas ──────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email").toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Exam Schemas ──────────────────────────────────────────────

const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Option text is required"),
  image: z.string().optional(),
});

export const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionImage: z.string().optional(),
  questionType: z.enum(["single", "multiple", "truefalse"]),
  options: z.array(questionOptionSchema).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.string()).min(1, "At least one correct answer required"),
  marks: z.number().min(0).default(1),
  negativeMarks: z.number().min(0).default(0),
  explanation: z.string().optional(),
  explanationImage: z.string().optional(),
  timeLimitSeconds: z.number().min(0).optional(),
  order: z.number().min(0),
});

export const examStep1Schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  thumbnail: z.string().optional(),
  isFree: z.boolean(),
  price: z.number().min(0).default(0),
  passingPercentage: z.number().min(0).max(100).default(40),
  negativeMarkingEnabled: z.boolean().default(false),
  maxAttempts: z.number().min(1).default(1),
  resultVisibility: z.enum(["hidden", "score_only", "full"]).default("score_only"),
  showExplanations: z.boolean().default(false),
  allowReattempt: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // status is set by the admin when they click Save Draft / Publish
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const examStep2Schema = z.object({
  totalDuration: z.number().min(1, "Duration must be at least 1 minute"),
  autoDistributeTime: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
});

// ── Doubt Schema ──────────────────────────────────────────────
export const doubtSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  image: z.string().optional(),
});

export const doubtReplySchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty").max(10000),
  replyImage: z.string().optional(),
});

// ── Video Schema ──────────────────────────────────────────────
export const videoSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1),
  thumbnail: z.string().optional(),
  googleDriveLink: z.string().url("Invalid Google Drive URL").optional().or(z.literal("")),
  youtubeLink: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
  displayOrder: z.number().default(0),
  isVisible: z.boolean().default(true),
  duration: z.string().optional(),
}).refine(
  (data) => data.googleDriveLink || data.youtubeLink,
  { message: "At least one video link (Google Drive or YouTube) is required" }
);

// ── Profile Update Schema ─────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  avatar: z.string().optional(),
});

// ── Payment Schema ────────────────────────────────────────────
export const createOrderSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  examId: z.string(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ExamStep1Input = z.output<typeof examStep1Schema>;
export type ExamStep2Input = z.output<typeof examStep2Schema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type DoubtInput = z.infer<typeof doubtSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
