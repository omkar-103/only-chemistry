// ============================================================
// RHG Exam Portal — All TypeScript Types & Interfaces
// ============================================================

// ── User / Auth ──────────────────────────────────────────────
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
  totalTimeOnSite?: number;
  lastActive?: string;
}

export interface IStudentProfile extends IUser {
  purchasedExams: string[];
  totalTimeOnSite: number; // seconds
  lastActive?: string;
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

// ── Categories ────────────────────────────────────────────────
export type ExamCategory =
  | "JEE Main"
  | "JEE Advanced"
  | "GATE"
  | "MHT-CET"
  | "CSIR NET"
  | "UGC NET"
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

// ── Questions ─────────────────────────────────────────────────
export type QuestionType = "single" | "multiple" | "truefalse";

export interface IOption {
  id: string;
  text: string;
  image?: string;
}

export interface IQuestion {
  _id?: string;
  questionText: string;
  questionImage?: string;
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

// ── Exams ─────────────────────────────────────────────────────
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

// ── Exam Attempts ─────────────────────────────────────────────
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

// ── Results ───────────────────────────────────────────────────
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

// ── Payments ──────────────────────────────────────────────────
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

// ── Doubts ────────────────────────────────────────────────────
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

// ── Videos ────────────────────────────────────────────────────
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

// ── Notifications ─────────────────────────────────────────────
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

// ── Audit Logs ────────────────────────────────────────────────
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

// ── Analytics ─────────────────────────────────────────────────
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

export interface IDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalExams: number;
  totalRevenue: number;
  recentPayments: IPayment[];
  examAttempts: number;
  averageScore: number;
  pendingDoubts: number;
  dailyVisitors: number;
  revenueData: IRevenueData[];
  studentGrowth: IStudentGrowthData[];
}

// ── API Response ──────────────────────────────────────────────
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

// ── Exam Builder Steps ────────────────────────────────────────
export interface ExamStep1Data {
  title: string;
  description: string;
  category: string;
  subject: string;
  difficulty: DifficultyLevel;
  thumbnail?: string;
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

// ── Pagination ────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
}

// ── Exam Security ─────────────────────────────────────────────
export interface ExamSecurityState {
  tabSwitchCount: number;
  fullscreenExitCount: number;
  isFullscreen: boolean;
  violations: IViolation[];
  isAutoSubmitted: boolean;
}
