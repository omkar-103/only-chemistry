import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  severity: "info" | "warning" | "error" | "critical";
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: String,
    userEmail: String,
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: String,
    details: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, action: 1 });
AuditLogSchema.index({ createdAt: -1 });
// Auto-delete audit logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;
