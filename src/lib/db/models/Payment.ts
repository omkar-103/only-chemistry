import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  orderId: string;
  paymentId?: string;
  amount: number; // in paise
  currency: string;
  status: "created" | "pending" | "paid" | "failed" | "refunded";
  razorpaySignature?: string;
  notes?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded"],
      default: "created",
    },
    razorpaySignature: { type: String, select: false },
    notes: { type: Map, of: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PaymentSchema.index({ studentId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });

const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export default Payment;
