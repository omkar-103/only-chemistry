// GET  /api/admin/students/[id] — student detail
// PATCH /api/admin/students/[id] — toggle-status / assign-categories / update
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { requireAdmin, successResponse, errorResponse, createAuditLog, getClientIP } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  await connectDB();

  const student = await User.findOne({ _id: id, role: "student" })
    .select("-password -otp -otpExpiry -sessionToken")
    .lean();

  if (!student) return errorResponse("Student not found", 404);

  const assigned = Array.from(
    new Set([
      ...(student.assignedExams || []),
      ...(student.assignedCategories || []),
    ])
  );
  const active = student.lastActiveAt || student.lastActive || student.lastLogin || null;

  return successResponse({
    ...student,
    assignedExams: assigned,
    assignedCategories: assigned,
    lastActiveAt: active,
    lastActive: active,
  }, "Student fetched");
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const student = await User.findOne({ _id: id, role: "student" });
  if (!student) return errorResponse("Student not found", 404);

  // ── Toggle active status ──────────────────────────────────────
  if (body.action === "toggle-status") {
    student.isActive = !student.isActive;
    await student.save();

    await createAuditLog({
      userId: authResult.user.userId,
      action: student.isActive ? "student_activated" : "student_suspended",
      resource: "User",
      resourceId: id,
      details: { studentEmail: student.email, studentName: student.name },
      ip: getClientIP(req),
      severity: "warning",
    });

    return successResponse(
      { isActive: student.isActive },
      student.isActive ? "Student activated" : "Student suspended"
    );
  }

  // ── Assign / update categories or exams (admin only) ─────────
  if (body.action === "assign-categories" || body.action === "assign-exams" || body.assignedExams || body.assignedCategories) {
    const rawCategories = body.assignedExams || body.assignedCategories;
    if (!Array.isArray(rawCategories)) {
      return errorResponse("assignedExams must be an array", 400);
    }
    const categories = (rawCategories as unknown[])
      .map((c) => (typeof c === "string" ? c.trim() : ""))
      .filter(Boolean);

    student.assignedExams = categories;
    student.assignedCategories = categories;
    await student.save();

    await createAuditLog({
      userId: authResult.user.userId,
      action: "student_exams_assigned",
      resource: "User",
      resourceId: id,
      details: {
        studentEmail: student.email,
        studentName: student.name,
        assignedExams: categories,
      },
      ip: getClientIP(req),
      severity: "info",
    });

    return successResponse(
      {
        assignedExams: student.assignedExams,
        assignedCategories: student.assignedCategories,
      },
      "Assigned exams updated successfully"
    );
  }

  // ── Generic field update (safe fields only — password is NEVER allowed) ─
  const allowedFields = ["name", "mobile", "isActive", "isVerified"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (student as any)[field] = body[field];
    }
  }
  await student.save();
  return successResponse(
    await User.findById(student._id).select("-password -otp -otpExpiry -sessionToken").lean(),
    "Student updated"
  );
}
