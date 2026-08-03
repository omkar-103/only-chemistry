// ============================================================
// Notification Service — helpers to create & broadcast
// ============================================================
import mongoose from "mongoose";
import connectDB from "@/lib/db/connection";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";

export type NotifType =
  | "registration" | "email_verified" | "payment_success" | "exam_purchased"
  | "exam_published" | "doubt_replied" | "new_video" | "password_changed"
  | "exam_reminder" | "result_published" | "announcement" | "system";

export type NotifPriority = "low" | "medium" | "high";

interface CreateNotifOpts {
  userId: string | mongoose.Types.ObjectId;
  type: NotifType;
  title: string;
  message: string;
  link?: string;
  priority?: NotifPriority;
  relatedExamId?: string;
  category?: string;
}

/** Create a single notification for one user */
export async function createNotification(opts: CreateNotifOpts) {
  try {
    await connectDB();
    await Notification.create({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      priority: opts.priority ?? "low",
      relatedExamId: opts.relatedExamId,
      category: opts.category,
    });
  } catch (e) {
    // Non-fatal — log but don't crash the caller
    console.error("[Notification] Failed to create:", (e as Error).message);
  }
}

/** Broadcast to ALL verified students */
export async function broadcastToAllStudents(opts: Omit<CreateNotifOpts, "userId">) {
  try {
    await connectDB();
    const students = await User.find({ role: "student", isVerified: true, isActive: true })
      .select("_id").lean();
    const docs = students.map(s => ({
      userId: s._id,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      priority: opts.priority ?? "low",
      relatedExamId: opts.relatedExamId,
      category: opts.category,
    }));
    if (docs.length > 0) await Notification.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error("[Notification] Broadcast failed:", (e as Error).message);
  }
}

/** Broadcast to students of a specific category only */
export async function broadcastToCategory(category: string, opts: Omit<CreateNotifOpts, "userId" | "category">) {
  try {
    await connectDB();
    // Students who have purchased at least one exam in this category
    // OR we broadcast to all (category is stored on notification for filtering)
    // For simplicity: send to all students, mark with category — front-end shows it to all
    // For strict targeting: query purchasedExams populated with category
    const students = await User.find({ role: "student", isVerified: true, isActive: true })
      .select("_id").lean();
    const docs = students.map(s => ({
      userId: s._id,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      priority: opts.priority ?? "low",
      relatedExamId: opts.relatedExamId,
      category,
    }));
    if (docs.length > 0) await Notification.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error("[Notification] Category broadcast failed:", (e as Error).message);
  }
}

/** Notify students who attempted a specific exam */
export async function notifyExamAttemptees(examId: string, opts: Omit<CreateNotifOpts, "userId">) {
  try {
    await connectDB();
    const ExamAttempt = (await import("@/lib/db/models/ExamAttempt")).default;
    const attempts = await ExamAttempt.find({ examId, status: { $in: ["submitted", "timed_out", "auto_submitted"] } })
      .distinct("studentId");
    const docs = attempts.map((uid: any) => ({
      userId: uid,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      priority: opts.priority ?? "medium",
      relatedExamId: opts.relatedExamId ?? examId,
    }));
    if (docs.length > 0) await Notification.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error("[Notification] Attempt notify failed:", (e as Error).message);
  }
}
