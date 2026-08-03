// GET /api/admin/notifications/history — recent broadcast announcements
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Notification from "@/lib/db/models/Notification";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    // Get unique announcements by deduplicating on title+createdAt (one doc per broadcast)
    const history = await Notification.find({ type: "announcement" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Deduplicate by title + within 1 minute window (same broadcast appears for every user)
    const seen = new Set<string>();
    const deduped = history.filter(n => {
      const key = `${n.title}::${Math.floor(new Date(n.createdAt).getTime() / 60000)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return successResponse(deduped.slice(0, 20), "Notification history fetched");
  } catch (e) {
    return errorResponse("Failed to fetch history", 500);
  }
}
