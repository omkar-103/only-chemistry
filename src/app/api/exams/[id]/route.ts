import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Exam from "@/lib/db/models/Exam";
import User from "@/lib/db/models/User";
import { requireAuth, requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";
import { checkExamAccess, logExamAccess } from "@/lib/auth/accessControl";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    await connectDB();

    const exam = await Exam.findById(id).lean();
    if (!exam) return errorResponse("Exam not found", 404);

    // Students can only see published exams
    if (authResult.user.role === "student" && exam.status !== "published") {
      return errorResponse("Exam not found", 404);
    }

    // Access control check for students
    if (authResult.user.role === "student") {
      const student = await User.findById(authResult.user.userId)
        .select("name email assignedExams assignedCategories purchasedExams")
        .lean();

      const accessResult = checkExamAccess(
        {
          role: "student",
          assignedExams: student?.assignedExams,
          assignedCategories: student?.assignedCategories,
          purchasedExams: student?.purchasedExams,
        },
        exam
      );

      logExamAccess(student?.email || authResult.user.email, id, accessResult);

      if (!accessResult.hasAccess) {
        return errorResponse("You do not have access to this exam.", 403);
      }

      const sanitizedExam = {
        ...exam,
        isPurchased: true,
        hasAccess: true,
        // Don't expose questions until exam starts
        questions: undefined,
        questionCount: exam.questions.length,
      };
      return successResponse(sanitizedExam, "Exam fetched successfully");
    }

    return successResponse(exam, "Exam fetched successfully");
  } catch (error) {
    console.error("[EXAM GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch exam", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    if (body.accessType === "free") {
      body.isFree = true;
      body.price = 0;
    } else if (body.accessType === "restricted") {
      body.isFree = false;
    }

    const exam = await Exam.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!exam) return errorResponse("Exam not found", 404);

    return successResponse(exam, "Exam updated successfully");
  } catch (error) {
    console.error("[EXAM PUT] Error:", (error as Error).message);
    return errorResponse("Failed to update exam", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    await connectDB();

    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) return errorResponse("Exam not found", 404);

    return successResponse({}, "Exam deleted successfully");
  } catch (error) {
    console.error("[EXAM DELETE] Error:", (error as Error).message);
    return errorResponse("Failed to delete exam", 500);
  }
}
