// GET  /api/notifications        — list user's notifications
// PATCH /api/notifications       — mark ALL as read
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Notification from "@/lib/db/models/Notification";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const page  = Math.max(1,   parseInt(searchParams.get("page")  || "1"));
    const skip  = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: auth.user.userId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: auth.user.userId, isRead: false }),
    ]);

    return successResponse({ notifications, unreadCount, total }, "Notifications fetched");
  } catch (e) {
    return errorResponse("Failed to fetch notifications", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    await Notification.updateMany(
      { userId: auth.user.userId, isRead: false },
      { $set: { isRead: true } }
    );
    return successResponse({}, "All notifications marked as read");
  } catch (e) {
    return errorResponse("Failed to update notifications", 500);
  }
}
