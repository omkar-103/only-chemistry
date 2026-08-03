import mongoose, { Schema, Document, Model } from "mongoose";

// ── Per-question response analytics ───────────────────────────
export interface IResponseDocument {
  questionId:       mongoose.Types.ObjectId;
  questionNo:       number;
  selectedOptions:  string[];
  correctAnswers:   string[];
  isCorrect:        boolean;
  marksAwarded:     number;
  negativeMarks:    number;
  timeTakenSeconds: number;
  startTime?:       Date;
  endTime?:         Date;
  isMarkedForReview:boolean;
  visitCount:       number;
  answerChanged:    boolean;
  finalAnswer:      string[]; // same as selectedOptions at submit time
  visitedAt?:       Date;
  answeredAt?:      Date;
}

// ── Security violation record ──────────────────────────────────
export interface IViolationDocument {
  type:      string;
  timestamp: Date;
  count:     number;
}

// ── Device / session metadata ──────────────────────────────────
export interface ISessionMetadata {
  browser:     string;
  device:      string;
  os:          string;
  ip:          string;
  userAgent:   string;
  loginTime?:  Date;
}

// ── Main attempt document ──────────────────────────────────────
export interface IExamAttemptDocument extends Document {
  examId:              mongoose.Types.ObjectId;
  studentId:           mongoose.Types.ObjectId;
  attemptNumber:       number;

  // Responses
  responses:           IResponseDocument[];
  violations:          IViolationDocument[];

  // Status
  status:              "in_progress" | "submitted" | "timed_out" | "auto_submitted";
  isAutoSubmitted:     boolean;
  submissionReason?:   string; // "manual" | "time_up" | "fullscreen_violation" | "tab_switch"

  // Timing
  startedAt:           Date;
  submittedAt?:        Date;
  totalExamTimeSeconds:number; // totalDuration * 60
  timeTakenSeconds:    number; // actual time used
  timeRemainingSeconds:number;

  // Score
  score:               number;
  totalMarks:          number;
  percentage:          number;
  isPassed:            boolean;
  rank?:               number;
  timeTakenMinutes?:   number;

  // Question-level counters
  totalQuestions:      number;
  answeredCount:       number;
  correctCount:        number;
  incorrectCount:      number;
  skippedCount:        number;
  markedForReviewCount:number;

  // Violations summary
  tabSwitchCount:      number;
  fullscreenExitCount: number;
  totalViolations:     number;

  // Session metadata
  sessionMetadata?:    ISessionMetadata;

  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new Schema<IResponseDocument>(
  {
    questionId:        { type: Schema.Types.ObjectId, required: true },
    questionNo:        { type: Number, default: 0 },
    selectedOptions:   { type: [String], default: [] },
    correctAnswers:    { type: [String], default: [] },
    isCorrect:         { type: Boolean, default: false },
    marksAwarded:      { type: Number, default: 0 },
    negativeMarks:     { type: Number, default: 0 },
    timeTakenSeconds:  { type: Number, default: 0 },
    startTime:         Date,
    endTime:           Date,
    isMarkedForReview: { type: Boolean, default: false },
    visitCount:        { type: Number, default: 0 },
    answerChanged:     { type: Boolean, default: false },
    finalAnswer:       { type: [String], default: [] },
    visitedAt:         Date,
    answeredAt:        Date,
  },
  { _id: false }
);

const ViolationSchema = new Schema<IViolationDocument>(
  {
    type: {
      type: String,
      enum: ["tab_switch", "fullscreen_exit", "copy_paste", "right_click", "devtools", "network_disconnect", "blur"],
    },
    timestamp: { type: Date, default: Date.now },
    count:     { type: Number, default: 1 },
  },
  { _id: false }
);

const SessionMetadataSchema = new Schema<ISessionMetadata>(
  {
    browser:   { type: String, default: "" },
    device:    { type: String, default: "" },
    os:        { type: String, default: "" },
    ip:        { type: String, default: "" },
    userAgent: { type: String, default: "" },
    loginTime: Date,
  },
  { _id: false }
);

const ExamAttemptSchema = new Schema<IExamAttemptDocument>(
  {
    examId:    { type: Schema.Types.ObjectId, ref: "Exam",  required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User",  required: true },
    attemptNumber: { type: Number, default: 1 },

    responses:  { type: [ResponseSchema],  default: [] },
    violations: { type: [ViolationSchema], default: [] },

    status: {
      type:    String,
      enum:    ["in_progress", "submitted", "timed_out", "auto_submitted"],
      default: "in_progress",
    },
    isAutoSubmitted:   { type: Boolean, default: false },
    submissionReason:  String,

    startedAt:             { type: Date, default: Date.now },
    submittedAt:           Date,
    totalExamTimeSeconds:  { type: Number, default: 0 },
    timeTakenSeconds:      { type: Number, default: 0 },
    timeRemainingSeconds:  { type: Number, default: 0 },

    score:       { type: Number, default: 0 },
    totalMarks:  { type: Number, default: 0 },
    percentage:  { type: Number, default: 0 },
    isPassed:    { type: Boolean, default: false },
    rank:        Number,
    timeTakenMinutes: Number,

    totalQuestions:       { type: Number, default: 0 },
    answeredCount:        { type: Number, default: 0 },
    correctCount:         { type: Number, default: 0 },
    incorrectCount:       { type: Number, default: 0 },
    skippedCount:         { type: Number, default: 0 },
    markedForReviewCount: { type: Number, default: 0 },

    tabSwitchCount:      { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    totalViolations:     { type: Number, default: 0 },

    sessionMetadata: SessionMetadataSchema,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
ExamAttemptSchema.index({ examId: 1, studentId: 1 });
ExamAttemptSchema.index({ studentId: 1, createdAt: -1 });
ExamAttemptSchema.index({ status: 1 });
ExamAttemptSchema.index({ examId: 1, isPassed: 1 });

const ExamAttempt: Model<IExamAttemptDocument> =
  mongoose.models.ExamAttempt ||
  mongoose.model<IExamAttemptDocument>("ExamAttempt", ExamAttemptSchema);

export default ExamAttempt;
