// POST /api/doubts/[id]/reply — Admin reply to doubt
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Doubt from "@/lib/db/models/Doubt";
import Notification from "@/lib/db/models/Notification";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";
import { doubtReplySchema } from "@/lib/validators/schemas";

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    const validation = doubtReplySchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();

    const doubt = await Doubt.findByIdAndUpdate(
      id,
      {
        $set: {
          reply: validation.data.reply,
          replyImage: validation.data.replyImage,
          repliedBy: authResult.user.userId,
          repliedAt: new Date(),
          status: "answered",
        },
      },
      { new: true }
    );

    if (!doubt) return errorResponse("Doubt not found", 404);

    // Notify student
    await Notification.create({
      userId: doubt.studentId,
      type: "doubt_replied",
      title: "Your doubt has been answered!",
      message: `Your question "${doubt.title}" has received a reply from the admin.`,
      link: "/doubts",
    });

    return successResponse(doubt, "Reply submitted successfully");
  } catch (error) {
    console.error("[DOUBT REPLY] Error:", (error as Error).message);
    return errorResponse("Failed to submit reply", 500);
  }
}
