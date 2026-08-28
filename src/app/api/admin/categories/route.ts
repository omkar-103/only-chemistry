// GET  /api/admin/categories       — list all categories
// POST /api/admin/categories       — create category
// PUT  /api/admin/categories/[id]  — update category
// DELETE /api/admin/categories/[id] — delete category
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Category from "@/lib/db/models/Category";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";
import { ensureDefaultCategories, slugifyCategory } from "@/lib/db/ensureCategories";
import { z } from "zod";

const categorySchema = z.object({
  name:         z.string().min(1).max(100),
  slug:         z.string().max(100).optional(),
  description:  z.string().max(500).optional().default(""),
  icon:         z.string().optional().default("📚"),
  thumbnail:    z.string().url().optional().or(z.literal("")),
  banner:       z.string().url().optional().or(z.literal("")),
  color:        z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#3B82F6"),
  isActive:     z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await ensureDefaultCategories();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";
    const query = activeOnly ? { isActive: true } : {};
    const categories = await Category.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    return successResponse(categories, "Categories fetched");
  } catch (e) {
    console.error("[GET /api/admin/categories] Error:", e);
    return errorResponse("Failed to fetch categories", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const validation = categorySchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();
    await ensureDefaultCategories();

    const slug = validation.data.slug?.trim() || slugifyCategory(validation.data.name);

    const exists = await Category.findOne({
      $or: [{ name: validation.data.name }, { slug }],
    });
    if (exists) return errorResponse("Category with this name or slug already exists", 409);

    const category = await Category.create({
      ...validation.data,
      slug,
    });
    return successResponse(category, "Category created", 201);
  } catch (e: any) {
    if (e.code === 11000) return errorResponse("Category name or slug already exists", 409);
    return errorResponse("Failed to create category", 500);
  }
}
