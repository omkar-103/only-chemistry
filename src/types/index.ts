// ============================================================
// Only Chemistry Exam Portal â€” All TypeScript Types & Interfaces
// ============================================================

// â”€â”€ User / Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type UserRole = "student" | "admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Student-specific fields (present when role === "student")
  purchasedExams?: string[];
  assignedExams?: string[];
  assignedCategories?: string[];
  totalTimeOnSite?: number;
  lastActive?: string;
  lastActiveAt?: string;
}

export interface IStudentProfile extends IUser {
  purchasedExams: string[];
  assignedExams: string[];
  assignedCategories: string[];
  totalTimeOnSite: number; // seconds
  lastActive?: string;
  lastActiveAt?: string;
  currentSession?: string;
  deviceInfo?: {
    device: string;
    browser: string;
    ip: string;
    location?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface OTPVerifyData {
  email: string;
  otp: string;
}

// â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ExamCategory =
  | "JEE Main"
  | "JEE Advanced"
  | "GATE"
  | "MHT-CET"
  | "IIT JAM"
  | "NET"
  | "SET";

export interface ICategory {
  _id: string;
  name: ExamCategory | string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  examCount?: number;
  videoCount?: number;
}

// â”€â”€ Questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── ChemDraw Chemical Content ─────────────────────────────────────────────────
// Represents a piece of ChemDraw-created chemistry content attached to a
// question or answer option. CDXML is the canonical source; SVG/PNG is the
// display asset exported by ChemDraw itself (exact visual fidelity).
export type ChemDrawSourceFormat = "cdxml" | "svg-only" | "png-only" | "unknown";
export type ChemDrawRenderedFormat = "svg" | "png";

export interface ChemicalContent {
  type: "chemical-structure";
  sourceFormat: ChemDrawSourceFormat;  // format of the source file
  sourceData?: string;                  // original CDXML text (stored in MongoDB)
  renderedFormat: ChemDrawRenderedFormat; // format of the display asset
  renderedUrl: string;                  // Cloudinary CDN URL (SVG or PNG)
  renderedPublicId?: string;            // Cloudinary public_id for deletion
  altText?: string;
  width?: number;
  height?: number;
}

// ── Questions ────────────────────────────────────────────────────────────────
export type QuestionType = "single" | "multiple" | "truefalse";

export interface IOption {
  id: string;
  text?: string;             // optional — option may use chemicalContent instead
  image?: string;
  chemicalContent?: ChemicalContent;  // ChemDraw content for this option
}

export interface IQuestion {
  _id?: string;
  questionText: string;
  questionImage?: string;
  questionChemicalContents?: ChemicalContent[];  // array — question may have multiple structures
  questionType: QuestionType;
  options: IOption[];
  correctAnswers: string[]; // option ids
  marks: number;
  negativeMarks: number;
  explanation?: string;
  explanationImage?: string;
  timeLimitSeconds?: number; // per-question override
  order: number;
}

// â”€â”€ Exams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type DifficultyLevel = "easy" | "medium" | "hard";
export type ExamStatus = "draft" | "published" | "archived";
export type ResultVisibility = "hidden" | "score_only" | "full";

export interface IExam {
  _id: string;
  title: string;
  description: string;
  category: ExamCategory | string;
  subject: string;
  difficulty: DifficultyLevel;
  thumbnail?: string;
  accessType?: "free" | "restricted";
  visibleTo?: string[];
  isFree: boolean;
  price: number;
  status: ExamStatus;
  totalQuestions: number;
  totalDuration: number; // minutes
  autoDistributeTime: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passingPercentage: number;
  negativeMarkingEnabled: boolean;
  maxAttempts: number;
  resultVisibility: ResultVisibility;
  showExplanations: boolean;
  allowReattempt: boolean;
  startDate?: string;
  endDate?: string;
  questions?: IQuestion[];
  attemptCount?: number;
  isPurchased?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamListItem extends Omit<IExam, "questions"> {
  questionCount: number;
}

// â”€â”€ Exam Attempts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type AttemptStatus = "in_progress" | "submitted" | "timed_out" | "auto_submitted";

export interface IResponse {
  questionId: string;
  selectedOptions: string[];
  timeTakenSeconds: number;
  isMarkedForReview: boolean;
  visitedAt?: string;
  answeredAt?: string;
}

export interface IViolation {
  type: "tab_switch" | "fullscreen_exit" | "copy_paste" | "right_click" | "devtools" | "network_disconnect" | "blur";
  timestamp: string;
  count: number;
}

export interface IExamAttempt {
  _id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  responses: IResponse[];
  violations: IViolation[];
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  rank?: number;
  timeTakenMinutes?: number;
}

// â”€â”€ Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface IResultQuestion {
  question: IQuestion;
  selectedOptions: string[];
  isCorrect: boolean;
  marksObtained: number;
  timeTakenSeconds: number;
}

export interface IResult {
  attempt: IExamAttempt;
  exam: IExam;
  questions: IResultQuestion[];
  totalCorrect: number;
  totalWrong: number;
  totalUnattempted: number;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  rank?: number;
  timeTakenMinutes: number;
}

// â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "refunded";

export interface IPayment {
  _id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  examId: string;
  examTitle?: string;
  orderId: string;
  paymentId?: string;
  amount: number; // in paise
  currency: string;
  status: PaymentStatus;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

// â”€â”€ Doubts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type DoubtStatus = "pending" | "answered";

export interface IDoubt {
  _id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  category: string;
  title: string;
  description: string;
  image?: string;
  status: DoubtStatus;
  reply?: string;
  replyImage?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// â”€â”€ Videos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface IVideo {
  _id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  googleDriveLink?: string;
  youtubeLink?: string;
  displayOrder: number;
  isVisible: boolean;
  duration?: string;
  createdAt: string;
}

// â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type NotificationType =
  | "registration"
  | "email_verified"
  | "payment_success"
  | "exam_purchased"
  | "exam_published"
  | "doubt_replied"
  | "new_video"
  | "password_changed"
  | "exam_reminder"
  | "result_published";

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// â”€â”€ Audit Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface IAuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// â”€â”€ Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface IRevenueData {
  month: string;
  revenue: number;
  transactions: number;
}

export interface IStudentGrowthData {
  month: string;
  students: number;
}

export interface IExamStatsData {
  examTitle: string;
  attempts: number;
  avgScore: number;
  passRate: number;
}



// â”€â”€ API Response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface IDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalExams: number;
  publishedExams: number;
  examAttempts: number;
  averageScore: number;
  pendingDoubts: number;
  totalCategories: number;
  studentGrowth: { month: string; students: number }[];
  recentStudents: any[];
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// â”€â”€ Exam Builder Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ExamStep1Data {
  title: string;
  description: string;
  category: string;
  subject: string;
  difficulty: DifficultyLevel;
  thumbnail?: string;
  accessType?: "free" | "restricted";
  visibleTo?: string[];
  isFree: boolean;
  price: number;
  passingPercentage: number;
  negativeMarkingEnabled: boolean;
  maxAttempts: number;
  resultVisibility: ResultVisibility;
  showExplanations: boolean;
  allowReattempt: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ExamStep2Data {
  totalDuration: number;
  autoDistributeTime: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  perQuestionTimes?: Record<string, number>;
}

export interface ExamBuilderData extends ExamStep1Data, ExamStep2Data {
  questions: IQuestion[];
}

// â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
}

// â”€â”€ Exam Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ExamSecurityState {
  tabSwitchCount: number;
  fullscreenExitCount: number;
  isFullscreen: boolean;
  violations: IViolation[];
  isAutoSubmitted: boolean;
}

