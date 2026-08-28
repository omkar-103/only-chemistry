import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: "student" | "admin";
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  // OTP fields
  otp?: string;
  otpExpiry?: Date;
  otpAttempts: number;
  otpType?: "email_verify" | "password_reset";
  // Session management (single-session enforcement)
  sessionToken?: string;
  sessionTokenExpiry?: Date;
  // Tracking
  lastLogin?: Date;
  lastActive?: Date;
  lastActiveAt?: Date;
  totalTimeOnSite: number; // seconds
  // Purchased exams (legacy — kept for backward compat)
  purchasedExams: mongoose.Types.ObjectId[];
  // Category/Exam-based access (admin-assigned)
  assignedExams: string[];
  assignedCategories: string[];
  // Device info (from last login)
  deviceInfo?: {
    device: string;
    browser: string;
    ip: string;
    location?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: String,
    // OTP
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpType: { type: String, enum: ["email_verify", "password_reset"], select: false },
    // Session
    sessionToken: { type: String, select: false },
    sessionTokenExpiry: { type: Date, select: false },
    // Tracking
    lastLogin: Date,
    lastActive: Date,
    lastActiveAt: Date,
    totalTimeOnSite: { type: Number, default: 0 },
    purchasedExams: [{ type: Schema.Types.ObjectId, ref: "Exam" }],
    // Category/Exam-based access: admin assigns exam categories to students
    assignedExams: { type: [String], default: [] },
    assignedCategories: { type: [String], default: [] },
    deviceInfo: {
      device: String,
      browser: String,
      ip: String,
      location: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
// Note: email unique index is already created by { unique: true } in field definition
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ purchasedExams: 1 });
UserSchema.index({ sessionToken: 1 }, { sparse: true });

// ── Pre-save Middleware: Hash Password ────────────────────────
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Methods ──────────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateOTP = function (): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

// ── Model ─────────────────────────────────────────────────────
const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
