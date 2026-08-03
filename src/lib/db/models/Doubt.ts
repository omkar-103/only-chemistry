import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoubtDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  category: string;
  title: string;
  description: string;
  image?: string;
  status: "pending" | "answered";
  reply?: string;
  replyImage?: string;
  repliedBy?: mongoose.Types.ObjectId;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DoubtSchema = new Schema<IDoubtDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: [true, "Category is required"] },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    image: String,
    status: {
      type: String,
      enum: ["pending", "answered"],
      default: "pending",
    },
    reply: String,
    replyImage: String,
    repliedBy: { type: Schema.Types.ObjectId, ref: "User" },
    repliedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DoubtSchema.index({ studentId: 1, createdAt: -1 });
DoubtSchema.index({ status: 1 });

const Doubt: Model<IDoubtDocument> =
  mongoose.models.Doubt || mongoose.model<IDoubtDocument>("Doubt", DoubtSchema);

export default Doubt;
