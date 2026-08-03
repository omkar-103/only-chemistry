// PATCH /api/notifications/[id]/read  — mark one as read
// DELETE /api/notifications/[id]       — delete one
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Notification from "@/lib/db/models/Notification";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await connectDB();
    await Notification.findOneAndUpdate(
      { _id: id, userId: auth.user.userId },
      { $set: { isRead: true } }
    );
    return successResponse({}, "Notification marked as read");
  } catch {
    return errorResponse("Failed to update notification", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await connectDB();
    await Notification.findOneAndDelete({ _id: id, userId: auth.user.userId });
    return successResponse({}, "Notification deleted");
  } catch {
    return errorResponse("Failed to delete notification", 500);
  }
}
