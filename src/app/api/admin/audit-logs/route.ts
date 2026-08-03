// GET /api/admin/audit-logs
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import AuditLog from "@/lib/db/models/AuditLog";
import { requireAdmin, successResponse, paginatedResponse, errorResponse, parsePagination } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const severity = searchParams.get("severity");
    const action = searchParams.get("action");

    const query: Record<string, unknown> = {};
    if (severity) query.severity = severity;
    if (action) query.action = { $regex: action, $options: "i" };

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return paginatedResponse(logs, total, page, limit, "Audit logs fetched");
  } catch (error) {
    return errorResponse("Failed to fetch audit logs", 500);
  }
}
