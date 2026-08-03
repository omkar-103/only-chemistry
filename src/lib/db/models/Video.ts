import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVideoDocument extends Document {
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  googleDriveLink?: string;
  youtubeLink?: string;
  displayOrder: number;
  isVisible: boolean;
  duration?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideoDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: { type: String, required: [true, "Category is required"] },
    thumbnail: String,
    googleDriveLink: String,
    youtubeLink: String,
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    duration: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

VideoSchema.index({ category: 1, isVisible: 1, displayOrder: 1 });

const Video: Model<IVideoDocument> =
  mongoose.models.Video || mongoose.model<IVideoDocument>("Video", VideoSchema);

export default Video;
