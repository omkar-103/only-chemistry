// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = "Only Chemistry";
export const APP_TAGLINE = "Premier Chemistry Education Platform";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://onlychemistry.com";

// ── Exam Categories ───────────────────────────────────────────
export const EXAM_CATEGORIES = [
  { value: "JEE Main", label: "JEE Main", color: "#3B82F6", icon: "⚛️" },
  { value: "JEE Advanced", label: "JEE Advanced", color: "#8B5CF6", icon: "🔬" },
  { value: "GATE", label: "GATE", color: "#10B981", icon: "🎓" },
  { value: "MHT-CET", label: "MHT-CET", color: "#F59E0B", icon: "📚" },
  { value: "CSIR NET", label: "CSIR NET", color: "#EF4444", icon: "🧪" },
  { value: "UGC NET", label: "UGC NET", color: "#EC4899", icon: "🏛️" },
  { value: "SET", label: "SET", color: "#14B8A6", icon: "📝" },
] as const;

// ── JWT ───────────────────────────────────────────────────────
export const JWT_ACCESS_EXPIRES = "15m";
export const JWT_REFRESH_EXPIRES = "7d";

// ── OTP ───────────────────────────────────────────────────────
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 3;

// ── Rate Limiting ─────────────────────────────────────────────
export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15min
  API: { windowMs: 60 * 1000, max: 100 }, // 100 per minute
  UPLOAD: { windowMs: 60 * 1000, max: 5 }, // 5 uploads per minute
} as const;

// ── Pagination ────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// ── File Upload ───────────────────────────────────────────────
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const CLOUDINARY_FOLDER = {
  EXAM_THUMBNAILS: "rhg/exam-thumbnails",
  QUESTION_IMAGES: "rhg/question-images",
  DOUBT_IMAGES: "rhg/doubt-images",
  VIDEO_THUMBNAILS: "rhg/video-thumbnails",
  AVATARS: "rhg/avatars",
} as const;

// ── Exam Security ─────────────────────────────────────────────
export const MAX_TAB_SWITCHES = 2; // auto-submit after this many
export const VIOLATION_TYPES = {
  TAB_SWITCH: "tab_switch",
  FULLSCREEN_EXIT: "fullscreen_exit",
  COPY_PASTE: "copy_paste",
  RIGHT_CLICK: "right_click",
  DEVTOOLS: "devtools",
  NETWORK_DISCONNECT: "network_disconnect",
  BLUR: "blur",
} as const;

// ── Question Colors (for palette) ─────────────────────────────
export const QUESTION_PALETTE_COLORS = {
  not_visited: "bg-slate-400",
  unanswered: "bg-red-500",
  answered: "bg-green-500",
  marked: "bg-purple-500",
  answered_marked: "bg-purple-500",
} as const;

// ── Difficulty Colors ─────────────────────────────────────────
export const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", color: "text-green-600", bg: "bg-green-100", darkBg: "dark:bg-green-900/30", darkColor: "dark:text-green-400" },
  medium: { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100", darkBg: "dark:bg-yellow-900/30", darkColor: "dark:text-yellow-400" },
  hard: { label: "Hard", color: "text-red-600", bg: "bg-red-100", darkBg: "dark:bg-red-900/30", darkColor: "dark:text-red-400" },
} as const;

// ── Payment ───────────────────────────────────────────────────
export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "₹";

// ── Date Formats ──────────────────────────────────────────────
export const DATE_FORMAT = "dd MMM yyyy";
export const DATE_TIME_FORMAT = "dd MMM yyyy, hh:mm a";

// ── Routes ────────────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  STUDENT: {
    DASHBOARD: "/dashboard",
    EXAMS: "/exams",
    RESULTS: "/results",
    PAYMENTS: "/payments",
    DOUBTS: "/doubts",
    VIDEOS: "/videos",
    PROFILE: "/profile",
    NOTIFICATIONS: "/notifications",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    STUDENTS: "/admin/students",
    EXAMS: "/admin/exams",
    EXAM_CREATE: "/admin/exams/create",
    DOUBTS: "/admin/doubts",
    VIDEOS: "/admin/videos",
    CATEGORIES: "/admin/categories",
    NOTIFICATIONS: "/admin/notifications",
    ANALYTICS: "/admin/analytics",
    AUDIT_LOGS: "/admin/audit-logs",
    SETTINGS: "/admin/settings",
  },
  EXAM: {
    INSTRUCTIONS: (id: string) => `/exam/${id}/instructions`,
    ATTEMPT: (id: string) => `/exam/${id}/attempt`,
    RESULT: (attemptId: string) => `/results/${attemptId}`,
  },
} as const;

// ── Navigation Items ──────────────────────────────────────────
export const STUDENT_NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.STUDENT.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Exams", href: ROUTES.STUDENT.EXAMS, icon: "BookOpen" },
  { label: "Results", href: ROUTES.STUDENT.RESULTS, icon: "Trophy" },
  { label: "Learning Videos", href: ROUTES.STUDENT.VIDEOS, icon: "PlayCircle" },
  { label: "My Doubts", href: ROUTES.STUDENT.DOUBTS, icon: "MessageSquare" },
  { label: "Profile", href: ROUTES.STUDENT.PROFILE, icon: "User" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Students", href: ROUTES.ADMIN.STUDENTS, icon: "Users" },
  { label: "Exams", href: ROUTES.ADMIN.EXAMS, icon: "BookOpen" },
  { label: "Student Doubts", href: ROUTES.ADMIN.DOUBTS, icon: "MessageSquare" },
  { label: "Learning Videos", href: ROUTES.ADMIN.VIDEOS, icon: "PlayCircle" },
  { label: "Categories", href: ROUTES.ADMIN.CATEGORIES, icon: "Tag" },
  { label: "Notifications", href: ROUTES.ADMIN.NOTIFICATIONS, icon: "Bell" },
  { label: "Analytics", href: ROUTES.ADMIN.ANALYTICS, icon: "BarChart3" },
  { label: "Audit Logs", href: ROUTES.ADMIN.AUDIT_LOGS, icon: "Shield" },
  { label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: "Settings" },
] as const;
