import Category from "@/lib/db/models/Category";
import { CANONICAL_CATEGORIES } from "@/constants";

/**
 * Convert any string into a clean, uniform slug
 * Example: "JEE Main" -> "jee-main", "CSIR NET" -> "net", "IIT JAM" -> "iit-jam"
 */
export function slugifyCategory(str: string): string {
  if (!str) return "";
  const cleaned = str.trim().toLowerCase();
  if (cleaned === "csir net" || cleaned === "csir-net" || cleaned === "csirnet") return "net";
  return cleaned
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes any category identifier (slug, full name, old CSIR NET, etc.) to canonical form.
 */
export function normalizeCategory(val: string): { slug: string; name: string } {
  const slug = slugifyCategory(val);
  const found = CANONICAL_CATEGORIES.find((c) => c.slug === slug || slugifyCategory(c.name) === slug);
  if (found) {
    return { slug: found.slug, name: found.name };
  }
  return { slug, name: val.trim() };
}

let seedPromise: Promise<void> | null = null;

/**
 * Ensures the canonical 7 exam categories exist in the database without duplicates.
 * Also cleans up legacy UGC NET and updates CSIR NET to NET.
 */
export async function ensureDefaultCategories(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      // 1. Remove legacy UGC NET
      await Category.deleteMany({
        $or: [
          { name: { $regex: /^ugc[\s-]*net$/i } },
          { slug: { $regex: /^ugc[\s-]*net$/i } },
        ],
      });

      // 2. Normalize/rename CSIR NET to NET
      await Category.updateMany(
        {
          $or: [
            { name: { $regex: /^csir[\s-]*net$/i } },
            { slug: { $regex: /^csir[\s-]*net$/i } },
          ],
        },
        {
          $set: {
            name: "NET",
            slug: "net",
            description: "National Eligibility Test for Chemistry",
            icon: "🏛️",
            color: "#EC4899",
          },
        }
      );

      // 3. Upsert each canonical category if it does not exist
      for (const cat of CANONICAL_CATEGORIES) {
        const existing = await Category.findOne({
          $or: [
            { slug: cat.slug },
            { name: { $regex: new RegExp(`^${cat.name}$`, "i") } },
          ],
        });

        if (!existing) {
          await Category.create({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            isActive: true,
            displayOrder: cat.displayOrder,
          });
        } else {
          let needsSave = false;
          if (!existing.slug || existing.slug !== cat.slug) {
            existing.slug = cat.slug;
            needsSave = true;
          }
          if (!existing.displayOrder && existing.displayOrder !== 0) {
            existing.displayOrder = cat.displayOrder;
            needsSave = true;
          }
          if (needsSave) {
            await existing.save();
          }
        }
      }
    } catch (err) {
      console.error("[CATEGORY SEED] Error ensuring default categories:", err);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}
