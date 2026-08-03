// DELETE /api/videos/[id]
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Video from "@/lib/db/models/Video";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await params;
  await connectDB();
  const video = await Video.findById(id).lean();
  if (!video) return errorResponse("Video not found", 404);
  return successResponse(video, "Video fetched");
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await params;
  const body = await req.json();
  await connectDB();
  const video = await Video.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!video) return errorResponse("Video not found", 404);
  return successResponse(video, "Video updated");
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await params;
  await connectDB();
  const video = await Video.findByIdAndDelete(id);
  if (!video) return errorResponse("Video not found", 404);
  return successResponse({}, "Video deleted");
}
