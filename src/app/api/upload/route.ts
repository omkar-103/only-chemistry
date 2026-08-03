// POST /api/upload — Upload image to Cloudinary
// Accepts: FormData (file) OR JSON ({ file: "data:...", fileName, folder })
// Auth: any logged-in user (students need it for doubts, admins for exams)
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/utils";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY     = process.env.CLOUDINARY_API_KEY;
const API_SECRET  = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured =
  !!CLOUD_NAME && !!API_KEY && !!API_SECRET &&
  API_SECRET !== "your_cloudinary_api_secret_here";

if (isCloudinaryConfigured) {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
}

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB

// ── Shared upload logic ────────────────────────────────────────
async function uploadBase64(base64: string, folder: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto:good", fetch_format: "auto" },
      { width: 1400, height: 1050, crop: "limit" },
    ],
  });
  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    size:     result.bytes,
  };
}

// ── POST /api/upload ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // ── Cloudinary not configured → return mock URL for dev ──
  if (!isCloudinaryConfigured) {
    console.warn("[UPLOAD] ⚠️  Cloudinary not configured — returning placeholder.");
    return NextResponse.json({
      success: true,
      message: "Dev mode: Cloudinary not configured. Set CLOUDINARY_API_SECRET in .env.local",
      data: {
        url: `https://placehold.co/800x600/1a1a2e/gold?text=Image+Placeholder`,
        publicId: `dev-placeholder-${Date.now()}`,
        width: 800, height: 600, format: "png", size: 0,
        isPlaceholder: true,
      },
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let base64: string;
    let folder = "rhg-exam-portal/uploads";

    if (contentType.includes("multipart/form-data")) {
      // ── FormData upload ──
      const formData = await req.formData();
      const file     = formData.get("file") as File | null;
      folder         = (formData.get("folder") as string) || folder;

      if (!file) {
        return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json({ success: false, message: "File type not allowed. Accepted: PNG, JPG, WEBP" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, message: "File too large. Max 5MB" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      base64 = `data:${file.type};base64,${buf.toString("base64")}`;

    } else {
      // ── JSON / base64 upload (used by exam builder) ──
      const body = await req.json();

      if (!body.file) {
        return NextResponse.json({ success: false, message: "No file data provided" }, { status: 400 });
      }

      base64 = body.file; // already "data:image/...;base64,..."
      folder = body.folder || folder;

      // Validate mime from data URI
      const mimeMatch = base64.match(/^data:([^;]+);/);
      if (!mimeMatch || !ALLOWED_MIME.includes(mimeMatch[1])) {
        return NextResponse.json({ success: false, message: "File type not allowed. Accepted: PNG, JPG, WEBP" }, { status: 400 });
      }

      // Approximate size check (base64 is ~4/3 of actual size)
      const approxBytes = (base64.length * 3) / 4;
      if (approxBytes > MAX_BYTES * 1.4) {
        return NextResponse.json({ success: false, message: "File too large. Max 5MB" }, { status: 400 });
      }
    }

    // ── Upload to Cloudinary ──
    const data = await uploadBase64(base64, folder);

    return NextResponse.json({ success: true, message: "Image uploaded successfully", data });

  } catch (error) {
    const err = error as Error;
    console.error("[UPLOAD] Error:", err.message);
    return NextResponse.json({
      success: false,
      message: "Upload failed: " + err.message,
      hint: "Check that CLOUDINARY_API_SECRET is correctly set in .env.local",
    }, { status: 500 });
  }
}

// ── DELETE /api/upload ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!isCloudinaryConfigured) {
    return NextResponse.json({ success: true, message: "Dev mode: delete skipped" });
  }

  try {
    const { publicId } = await req.json();
    if (!publicId || publicId.startsWith("dev-placeholder")) {
      return NextResponse.json({ success: true, message: "Nothing to delete" });
    }
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Delete failed" }, { status: 500 });
  }
}
