import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOptionDocument {
  id: string;
  text: string;
  image?: string;
}

export interface IQuestionDocument {
  _id: mongoose.Types.ObjectId;
  questionText: string;
  questionImage?: string;
  questionType: "single" | "multiple" | "truefalse";
  options: IOptionDocument[];
  correctAnswers: string[]; // option ids
  marks: number;
  negativeMarks: number;
  explanation?: string;
  explanationImage?: string;
  timeLimitSeconds?: number;
  order: number;
}

export interface IExamDocument extends Document {
  title: string;
  description: string;
  category: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  thumbnail?: string;
  isFree: boolean;
  price: number; // in paise (0 for free)
  status: "draft" | "published" | "archived";
  totalDuration: number; // minutes
  autoDistributeTime: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passingPercentage: number;
  negativeMarkingEnabled: boolean;
  maxAttempts: number;
  resultVisibility: "hidden" | "score_only" | "full";
  showExplanations: boolean;
  allowReattempt: boolean;
  startDate?: Date;
  endDate?: Date;
  questions: IQuestionDocument[];
  createdBy: mongoose.Types.ObjectId;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOptionDocument>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    image: String,
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    questionText: { type: String, required: [true, "Question text is required"] },
    questionImage: String,
    questionType: {
      type: String,
      enum: ["single", "multiple", "truefalse"],
      default: "single",
    },
    options: { type: [OptionSchema], required: true },
    correctAnswers: { type: [String], required: true },
    marks: { type: Number, required: true, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    explanation: String,
    explanationImage: String,
    timeLimitSeconds: { type: Number, min: 0 },
    order: { type: Number, required: true },
  },
  { _id: true }
);

const ExamSchema = new Schema<IExamDocument>(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    thumbnail: String,
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    totalDuration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    autoDistributeTime: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    passingPercentage: { type: Number, default: 40, min: 0, max: 100 },
    negativeMarkingEnabled: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1 },
    resultVisibility: {
      type: String,
      enum: ["hidden", "score_only", "full"],
      default: "score_only",
    },
    showExplanations: { type: Boolean, default: false },
    allowReattempt: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
    questions: { type: [QuestionSchema], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
ExamSchema.index({ category: 1, status: 1 });
ExamSchema.index({ status: 1 });
ExamSchema.index({ isFree: 1 });
ExamSchema.index({ createdAt: -1 });
ExamSchema.index({ title: "text", description: "text" });

// ── Virtual: questionCount ────────────────────────────────────
ExamSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

const Exam: Model<IExamDocument> =
  mongoose.models.Exam || mongoose.model<IExamDocument>("Exam", ExamSchema);

export default Exam;
