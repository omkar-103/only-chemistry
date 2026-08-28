// ============================================================
// Access Control Helpers — Student Exam & Content Authorization
// ============================================================

import { slugifyCategory } from "@/lib/db/ensureCategories";

export interface StudentAccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  studentAssignedExams: string[];
  examVisibleTo: string[];
  isFree: boolean;
}

/**
 * Checks whether a student can access a specific exam.
 *
 * Rules:
 * 1. Admin role -> Access Granted (all exams)
 * 2. Free exam (accessType === "free" || (isFree === true && accessType !== "restricted")) -> Access Granted to all authenticated students
 * 3. Restricted exam (accessType === "restricted" || !isFree):
 *    - Extract student's assigned exams (from assignedExams and assignedCategories)
 *    - Extract exam's target categories (from visibleTo, fallback to [exam.category] if empty)
 *    - Access Granted ONLY if (studentAssigned ∩ examVisibleTo) is not empty (matching by slug or name)
 *    - Otherwise -> Access Denied (403)
 */
export function checkExamAccess(
  user: {
    role: string;
    assignedExams?: string[];
    assignedCategories?: string[];
    purchasedExams?: any[];
  } | null | undefined,
  exam: {
    accessType?: "free" | "restricted" | string;
    isFree?: boolean;
    visibleTo?: string[];
    category: string;
    _id?: any;
  }
): StudentAccessCheckResult {
  if (!user) {
    return {
      hasAccess: false,
      reason: "Unauthenticated",
      studentAssignedExams: [],
      examVisibleTo: exam.visibleTo || [],
      isFree: exam.accessType === "free" || exam.isFree === true,
    };
  }

  // Admins always have access
  if (user.role === "admin") {
    return {
      hasAccess: true,
      reason: "Admin role",
      studentAssignedExams: ["*"],
      examVisibleTo: exam.visibleTo || [],
      isFree: exam.accessType === "free" || exam.isFree === true,
    };
  }

  // Determine if exam is Free
  const isFree =
    exam.accessType === "free" ||
    (exam.isFree === true && exam.accessType !== "restricted");

  // If free, any student can access
  if (isFree) {
    const studentAssigned = Array.from(
      new Set([
        ...(user.assignedExams || []),
        ...(user.assignedCategories || []),
      ])
    );
    return {
      hasAccess: true,
      reason: "Free exam",
      studentAssignedExams: studentAssigned,
      examVisibleTo: exam.visibleTo || [],
      isFree: true,
    };
  }

  // Restricted exam check:
  // Extract all assigned categories for the student
  const studentAssigned = Array.from(
    new Set([
      ...(user.assignedExams || []),
      ...(user.assignedCategories || []),
    ])
  );

  // Extract visibility list for the exam
  const examVisibleTo: string[] =
    exam.visibleTo && exam.visibleTo.length > 0
      ? exam.visibleTo
      : exam.category
      ? [exam.category]
      : [];

  const studentSlugs = new Set(studentAssigned.map((s) => slugifyCategory(s)));
  const examSlugs = examVisibleTo.map((c) => slugifyCategory(c));

  // Check overlap (intersection) using normalized slugs as well as exact match
  const hasCategoryAccess =
    examSlugs.some((slug) => studentSlugs.has(slug)) ||
    examVisibleTo.some((cat) => studentAssigned.includes(cat));

  // Backward compatibility check for legacy purchased exams list
  const isPurchased = user.purchasedExams?.some(
    (p) => p.toString() === exam._id?.toString()
  );

  const hasAccess = hasCategoryAccess || !!isPurchased;

  return {
    hasAccess,
    reason: hasAccess
      ? "Matching assigned exam category"
      : "Category not assigned to student",
    studentAssignedExams: studentAssigned,
    examVisibleTo,
    isFree: false,
  };
}

/**
 * Log server-side access decisions cleanly without leaking any secrets
 */
export function logExamAccess(
  studentIdentifier: string,
  examIdentifier: string,
  result: StudentAccessCheckResult
) {
  console.log("--------------------------------------------------");
  console.log("[EXAM ACCESS]");
  console.log(`Student: ${studentIdentifier}`);
  console.log(`Exam: ${examIdentifier}`);
  console.log(
    `Student assigned exams: ${
      result.studentAssignedExams.join(", ") || "(none)"
    }`
  );
  console.log(
    `Exam visible to: ${
      result.isFree
        ? "ALL (Free Exam)"
        : result.examVisibleTo.join(", ") || "(none)"
    }`
  );
  console.log(`Access: ${result.hasAccess ? "GRANTED" : "DENIED"}`);
  console.log("--------------------------------------------------");
}
