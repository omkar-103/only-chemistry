// GET /api/payments/history — Student payment history
// GET /api/payments — Admin: all payments
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Payment from "@/lib/db/models/Payment";
import { requireAuth, successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const query: Record<string, unknown> = {};

    // Students only see their own payments
    if (authResult.user.role === "student") {
      query.studentId = authResult.user.userId;
    }

    const status = searchParams.get("status");
    if (status) query.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("studentId", "name email")
        .populate("examId", "title category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return paginatedResponse(payments, total, page, limit, "Payments fetched successfully");
  } catch (error) {
    console.error("[PAYMENTS GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch payments", 500);
  }
}
