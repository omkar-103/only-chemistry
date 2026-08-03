// GET  /api/admin/students/[id] — student detail
// PATCH /api/admin/students/[id] — toggle-status / update
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
  return successResponse(student, "Student fetched");
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const student = await User.findOne({ _id: id, role: "student" });
  if (!student) return errorResponse("Student not found", 404);

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

  // Generic field update
  const allowedFields = ["name", "mobile", "isActive", "isVerified"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (student as any)[field] = body[field];
    }
  }
  await student.save();
  return successResponse(student, "Student updated");
}
