// POST /api/admin/notifications/broadcast — Send announcement to all or category students
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";
import { z } from "zod";

const broadcastSchema = z.object({
  title:    z.string().min(3).max(200),
  message:  z.string().min(5).max(1000),
  link:     z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(), // if set, only that category's students
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const validation = broadcastSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { title, message, link, priority, category } = validation.data;
    const { broadcastToAllStudents, broadcastToCategory } =
      await import("@/lib/notifications/notificationService");

    if (category) {
      await broadcastToCategory(category, { type: "announcement", title, message, link, priority });
    } else {
      await broadcastToAllStudents({ type: "announcement", title, message, link, priority });
    }

    return successResponse(
      { category: category || "all" },
      `Announcement sent to ${category ? `${category} students` : "all students"}`
    );
  } catch (e) {
    console.error("[BROADCAST] Error:", (e as Error).message);
    return errorResponse("Failed to send announcement", 500);
  }
}
