// GET /api/exams — List exams with filters
// POST /api/exams — Create exam (admin)
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/connection";
import Exam from "@/lib/db/models/Exam";
import {
  requireAuth, requireAdmin, successResponse, errorResponse,
  paginatedResponse, parsePagination,
} from "@/lib/api/utils";
import { examStep1Schema, examStep2Schema } from "@/lib/validators/schemas";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const category   = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search     = searchParams.get("search");
    const isFree     = searchParams.get("isFree");

    // ── Build query ───────────────────────────────────────────
    const query: Record<string, unknown> = {};

    if (authResult.user.role === "student") {
      // Students only ever see published exams
      query.status = "published";
    } else {
      // Admins: apply status filter only when explicitly set to a real value
      const status = searchParams.get("status");
      if (status && status !== "all") {
        query.status = status;
      }
      // status = "all" or no status param → return all statuses
    }

    if (category)   query.category   = category;
    if (difficulty) query.difficulty  = difficulty;

    // isFree filter — only apply when explicitly set
    if (isFree === "true")  query.isFree = true;
    if (isFree === "false") query.isFree = false;

    if (search) {
      // Use regex search instead of $text so we don't need text indexes to be ready
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject:     { $regex: search, $options: "i" } },
        { category:    { $regex: search, $options: "i" } },
      ];
    }

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .select("-questions") // Don't expose questions in list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(query),
    ]);

    return paginatedResponse(exams, total, page, limit, "Exams fetched successfully");
  } catch (error) {
    console.error("[EXAMS GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch exams", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    console.log("[EXAMS POST] Creating exam:", body.title, "status:", body.status);

    // Validate step 1 (includes status now)
    const step1 = examStep1Schema.safeParse(body);
    if (!step1.success) {
      console.error("[EXAMS POST] Step1 validation failed:", step1.error.issues);
      return errorResponse(step1.error.issues[0].message, 400);
    }

    // Validate step 2
    const step2 = examStep2Schema.safeParse(body);
    if (!step2.success) {
      console.error("[EXAMS POST] Step2 validation failed:", step2.error.issues);
      return errorResponse(step2.error.issues[0].message, 400);
    }

    await connectDB();

    const exam = await Exam.create({
      ...step1.data,   // includes status from frontend
      ...step2.data,
      questions:  body.questions || [],
      createdBy:  authResult.user.userId,
    });

    console.log("[EXAMS POST] ✅ Exam created:", exam._id, "status:", exam.status);

    // Notify all students if published (fire-and-forget)
    if (exam.status === "published") {
      const qCount = (body.questions || []).length;
      const dur    = body.totalDuration || 0;
      import("@/lib/notifications/notificationService").then(({ broadcastToAllStudents }) => {
        broadcastToAllStudents({
          type: "exam_published",
          title: `New Exam Available: ${exam.title}`,
          message: `A new ${exam.isFree ? "free" : "paid"} exam has been added in ${exam.category}. ${qCount} questions · ${dur} mins.`,
          link: `/exams/${exam._id}`,
          priority: "medium",
          relatedExamId: exam._id.toString(),
          category: exam.category,
        });
      }).catch(() => {});
    }

    return successResponse(exam, "Exam created successfully", 201);
  } catch (error) {
    console.error("[EXAMS POST] Error:", (error as Error).message);
    return errorResponse("Failed to create exam: " + (error as Error).message, 500);
  }
}
