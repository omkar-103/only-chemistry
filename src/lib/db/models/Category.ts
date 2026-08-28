import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;          // emoji or Cloudinary URL
  thumbnail?: string;     // Cloudinary URL
  banner?: string;        // Cloudinary URL
  color: string;          // hex
  isActive: boolean;
  displayOrder: number;
  examCount?: number;
  videoCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name:         { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug:         { type: String, trim: true, lowercase: true, index: true },
    description:  { type: String, default: "", maxlength: 500 },
    icon:         { type: String, default: "📚" },
    thumbnail:    { type: String },
    banner:       { type: String },
    color:        { type: String, default: "#3B82F6" },
    isActive:     { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

CategorySchema.index({ isActive: 1, displayOrder: 1 });
CategorySchema.index({ name: 1 });
CategorySchema.index({ slug: 1 });

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
