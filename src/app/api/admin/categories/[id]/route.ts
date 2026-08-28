// PUT /api/admin/categories/[id] — update
// DELETE /api/admin/categories/[id] — delete
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Category from "@/lib/db/models/Category";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";
import { slugifyCategory } from "@/lib/db/ensureCategories";
import { z } from "zod";

const updateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  slug:         z.string().max(100).optional(),
  description:  z.string().max(500).optional(),
  icon:         z.string().optional(),
  thumbnail:    z.string().optional().or(z.literal("")),
  banner:       z.string().optional().or(z.literal("")),
  color:        z.string().optional(),
  isActive:     z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const cat = await Category.findById(id).lean();
    if (!cat) return errorResponse("Category not found", 404);
    return successResponse(cat, "Category fetched");
  } catch { return errorResponse("Failed to fetch category", 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();

    const updateData: Record<string, any> = { ...validation.data };
    if (validation.data.name && !validation.data.slug) {
      updateData.slug = slugifyCategory(validation.data.name);
    }

    const cat = await Category.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!cat) return errorResponse("Category not found", 404);
    return successResponse(cat, "Category updated");
  } catch (e: any) {
    if (e.code === 11000) return errorResponse("Category name or slug already exists", 409);
    return errorResponse("Failed to update category", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await connectDB();
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return errorResponse("Category not found", 404);
    return successResponse({}, "Category deleted");
  } catch { return errorResponse("Failed to delete category", 500); }
}
