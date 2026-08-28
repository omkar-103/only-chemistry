// POST /api/upload-chemical
// Uploads ChemDraw content: CDXML (canonical source) + SVG or PNG (display asset).
// The CDXML text is returned as sourceData (stored in MongoDB by the caller).
// The display asset (SVG or PNG) is uploaded to Cloudinary.
// Admin-only endpoint.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/utils";
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured =
  !!CLOUD_NAME && !!API_KEY && !!API_SECRET &&
  API_SECRET !== "your_cloudinary_api_secret_here";

if (isCloudinaryConfigured) {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
}

const MAX_CDXML_BYTES   = 10 * 1024 * 1024; // 10 MB
const MAX_DISPLAY_BYTES = 10 * 1024 * 1024; // 10 MB

// ── CDXML Validation ───────────────────────────────────────────
function validateCdxml(text: string, filename: string): { valid: true } | { valid: false; reason: string } {
  const trimmed = text.trimStart();
  // Must start with XML declaration, DOCTYPE, or <CDXML
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<!DOCTYPE") && !trimmed.includes("<CDXML")) {
    return { valid: false, reason: "Not a valid CDXML document. The file must contain a <CDXML> root element." };
  }
  // Must reference CDXML somewhere
  if (!trimmed.includes("CDXML")) {
    return { valid: false, reason: "File does not appear to be a ChemDraw CDXML file — <CDXML> element not found." };
  }
  // Reject obviously wrong formats
  if (trimmed.startsWith("<svg") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
    return { valid: false, reason: `File appears to be ${filename.endsWith(".svg") ? "SVG" : "HTML"}, not CDXML.` };
  }
  return { valid: true };
}

// ── SVG Validation ─────────────────────────────────────────────
function validateSvg(text: string): { valid: true } | { valid: false; reason: string } {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("<svg") && !trimmed.startsWith("<?xml") && !trimmed.startsWith("<!DOCTYPE svg")) {
    return { valid: false, reason: "File does not appear to be a valid SVG (no <svg> root element found)." };
  }
  // Reject dangerous SVG content
  const dangerous = ["<script", "javascript:", "onload=", "onerror=", "onclick="];
  const lower = text.toLowerCase();
  for (const d of dangerous) {
    if (lower.includes(d)) {
      return { valid: false, reason: `SVG contains potentially unsafe content: "${d}". Please export a clean SVG from ChemDraw.` };
    }
  }
  return { valid: true };
}

// ── Safe SVG Sanitization ──────────────────────────────────────
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/javascript:[^"'\s]*/gi, "");
}

// ── POST /api/upload-chemical ──────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const tag = "[CHEMDRAW]";
  console.log(`${tag} Upload started`);

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Expected multipart/form-data request" },
        { status: 400 }
      );
    }

    const formData    = await req.formData();
    const cdxmlFile   = formData.get("cdxmlFile")   as File | null;
    const displayFile = formData.get("displayFile")  as File | null;
    const folder      = (formData.get("folder") as string) || "rhg-exam-portal/chemical";

    // ── Display file required ──────────────────────────────────
    if (!displayFile) {
      return NextResponse.json({
        success: false,
        message: "Display file is required. Please upload an SVG or PNG exported from ChemDraw.",
        stage: "validation",
      }, { status: 400 });
    }

    const displayName = displayFile.name.toLowerCase();
    const isSvg = displayName.endsWith(".svg") || displayFile.type === "image/svg+xml";
    const isPng = displayName.endsWith(".png") || displayFile.type === "image/png";

    if (!isSvg && !isPng) {
      return NextResponse.json({
        success: false,
        message: `Unsupported display file format: "${displayFile.name}". Only SVG and PNG files are accepted.`,
        stage: "display-file-validation",
        action: "Export your ChemDraw structure as SVG (preferred) or PNG.",
      }, { status: 400 });
    }

    if (displayFile.size > MAX_DISPLAY_BYTES) {
      return NextResponse.json({
        success: false,
        message: `Display file is too large (${(displayFile.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
        stage: "display-file-validation",
      }, { status: 400 });
    }

    // ── CDXML validation (optional but recommended) ────────────
    let sourceData: string | undefined;
    let sourceFormat: "cdxml" | "svg-only" | "png-only" = isSvg ? "svg-only" : "png-only";

    if (cdxmlFile) {
      if (cdxmlFile.size > MAX_CDXML_BYTES) {
        return NextResponse.json({
          success: false,
          stage: "cdxml-validation",
          message: `CDXML file is too large (${(cdxmlFile.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
        }, { status: 400 });
      }

      const cdxmlText = await cdxmlFile.text();
      console.log(`${tag} CDXML received: ${cdxmlFile.name} (${cdxmlFile.size} bytes)`);

      const cdxmlResult = validateCdxml(cdxmlText, cdxmlFile.name);
      if (!cdxmlResult.valid) {
        console.error(`${tag} CDXML validation FAILED: ${cdxmlResult.reason}`);
        return NextResponse.json({
          success: false,
          stage: "cdxml-validation",
          file: cdxmlFile.name,
          message: `Invalid CDXML file: ${cdxmlResult.reason}`,
          action: "Please export the structure again from ChemDraw using File → Save As → .cdxml",
        }, { status: 400 });
      }
      console.log(`${tag} CDXML validation: PASSED`);
      sourceData = cdxmlText;
      sourceFormat = "cdxml";
    } else {
      console.log(`${tag} No CDXML provided — ${isSvg ? "svg-only" : "png-only"} mode`);
    }

    // ── Validate and prepare display asset ────────────────────
    const displayBuf = Buffer.from(await displayFile.arrayBuffer());
    const renderedFormat: "svg" | "png" = isSvg ? "svg" : "png";
    let displayBase64: string;

    if (isSvg) {
      let svgText = displayBuf.toString("utf-8");
      const svgResult = validateSvg(svgText);
      if (!svgResult.valid) {
        console.error(`${tag} SVG validation FAILED: ${svgResult.reason}`);
        return NextResponse.json({
          success: false,
          stage: "svg-validation",
          file: displayFile.name,
          message: `SVG validation failed: ${svgResult.reason}`,
          action: "Please re-export the SVG from ChemDraw.",
        }, { status: 400 });
      }
      svgText = sanitizeSvg(svgText);
      displayBase64 = `data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`;
      console.log(`${tag} SVG validation: PASSED`);
    } else {
      // Verify PNG magic bytes: 0x89 0x50 0x4E 0x47
      if (displayBuf.length < 4 || displayBuf[0] !== 0x89 || displayBuf[1] !== 0x50) {
        return NextResponse.json({
          success: false,
          stage: "png-validation",
          file: displayFile.name,
          message: "File does not appear to be a valid PNG image.",
          action: "Please re-export from ChemDraw as PNG.",
        }, { status: 400 });
      }
      displayBase64 = `data:image/png;base64,${displayBuf.toString("base64")}`;
      console.log(`${tag} PNG validation: PASSED`);
    }

    // ── Upload display asset to Cloudinary (with self-contained base64 fallback) ──
    console.log(`${tag} Processing display asset — format: ${renderedFormat}`);

    let finalRenderedUrl = displayBase64;
    let finalPublicId = `chem-${Date.now()}`;
    let imageWidth: number | undefined;
    let imageHeight: number | undefined;

    if (isCloudinaryConfigured) {
      try {
        const uploadOptions: Record<string, any> = {
          folder,
          resource_type: "image",
          public_id: `chem-${Date.now()}`,
        };
        if (isSvg) {
          uploadOptions.format = "svg";
        } else {
          uploadOptions.transformation = [{ quality: "auto:best" }];
        }

        const uploadResult = await cloudinary.uploader.upload(displayBase64, uploadOptions);
        console.log(`${tag} Cloudinary upload: PASSED — ${uploadResult.secure_url}`);
        finalRenderedUrl = uploadResult.secure_url || uploadResult.url;
        finalPublicId = uploadResult.public_id;
        imageWidth = uploadResult.width;
        imageHeight = uploadResult.height;
      } catch (cloudErr: any) {
        console.warn(`${tag} Cloudinary upload failed (${cloudErr.message}) — using high-fidelity data URL directly`);
        finalRenderedUrl = displayBase64;
      }
    } else {
      console.log(`${tag} Cloudinary not configured — using high-fidelity data URL directly for ChemDraw rendering`);
      finalRenderedUrl = displayBase64;
    }

    console.log(`${tag} Chemical content created successfully with valid display asset`);

    return NextResponse.json({
      success: true,
      message: "ChemDraw content uploaded successfully",
      data: {
        type: "chemical-structure",
        sourceFormat,
        sourceData,        // CDXML text — caller stores in MongoDB
        renderedFormat,
        renderedUrl: finalRenderedUrl,
        renderedPublicId: finalPublicId,
        width: imageWidth,
        height: imageHeight,
      },
    });

  } catch (error) {
    const err = error as Error;
    console.error(`[CHEMDRAW] ERROR:`, err.message);
    return NextResponse.json({
      success: false,
      stage: "unexpected-error",
      message: "ChemDraw upload failed: " + err.message,
    }, { status: 500 });
  }
}
