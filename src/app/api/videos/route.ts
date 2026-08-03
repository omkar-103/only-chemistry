// GET /api/videos | POST /api/videos
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Video from "@/lib/db/models/Video";
import { requireAuth, requireAdmin, successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api/utils";
import { videoSchema } from "@/lib/validators/schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {};

    if (authResult.user.role === "student") {
      query.isVisible = true;
    }

    if (category) query.category = category;

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(query),
    ]);

    return paginatedResponse(videos, total, page, limit, "Videos fetched successfully");
  } catch (error) {
    console.error("[VIDEOS GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch videos", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const validation = videoSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();
    const video = await Video.create({
      ...validation.data,
      createdBy: authResult.user.userId,
    });

    // Notify students about new video (category-targeted)
    if (video.isVisible) {
      import("@/lib/notifications/notificationService").then(({ broadcastToCategory, broadcastToAllStudents }) => {
        const notifData = {
          type: "new_video" as const,
          title: `New Video: ${video.title}`,
          message: `A new learning video has been added${video.category ? ` for ${video.category}` : ""}. Watch it now!`,
          link: "/videos",
          priority: "low" as const,
          category: video.category,
        };
        if (video.category) {
          broadcastToCategory(video.category, notifData);
        } else {
          broadcastToAllStudents(notifData);
        }
      }).catch(() => {});
    }

    return successResponse(video, "Video created successfully", 201);
  } catch (error) {
    console.error("[VIDEOS POST] Error:", (error as Error).message);
    return errorResponse("Failed to create video", 500);
  }
}
