import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  relatedExamId?: mongoose.Types.ObjectId;
  category?: string; // for category-specific broadcasts
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "registration", "email_verified", "payment_success", "exam_purchased",
        "exam_published", "doubt_replied", "new_video", "password_changed",
        "exam_reminder", "result_published", "announcement", "system",
      ],
      required: true,
    },
    title:   { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    link:    { type: String },
    isRead:  { type: Boolean, default: false, index: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    relatedExamId: { type: Schema.Types.ObjectId, ref: "Exam" },
    category: { type: String }, // e.g. "MHT-CET" for targeted broadcasts
  },
  { timestamps: true, versionKey: false }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;
