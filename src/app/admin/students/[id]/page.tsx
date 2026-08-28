"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserCheck, UserX, Mail, Phone, Calendar,
  BookOpen, Trophy, Clock, Shield, Tag, X, Check, Loader2, Plus, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import Link from "next/link";
import { formatLastActive } from "@/lib/utils/formatDate";

// ── Exam Category Assignment Modal ────────────────────────────
function CategoryModal({
  student,
  onClose,
  onSaved,
}: {
  student: any;
  onClose: () => void;
  onSaved: (categories: string[]) => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selected, setSelected] = useState<string[]>(
    student.assignedExams || student.assignedCategories || []
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get("/api/admin/categories?active=false")
      .then((r) => setCategories(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/students/${student._id}`, {
        action: "assign-exams",
        assignedExams: selected,
        assignedCategories: selected,
      });
      toast({
        title: "Assigned exams updated",
        description: `${selected.length} exam categor${
          selected.length === 1 ? "y" : "ies"
        } assigned to ${student.name}`,
        variant: "success",
      });
      onSaved(selected);
      onClose();
    } catch {
      toast({ title: "Failed to update assigned exams", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-black text-foreground text-lg">
              Manage Assigned Exams
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{student.name}</span> · {student.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 max-h-80 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Toggle exam categories assigned to this student:
          </p>
          {loadingCats ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-6">
              No categories found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {categories.map((cat) => {
                const isSelected =
                  selected.includes(cat.name) ||
                  (cat.slug && selected.includes(cat.slug));
                return (
                  <button
                    key={cat._id || cat.name}
                    type="button"
                    onClick={() => toggle(cat.name)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border hover:border-primary/40 text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-xl shrink-0">{cat.icon || "📚"}</span>
                    <span className="text-sm flex-1">{cat.name}</span>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {selected.length} exam categor{selected.length === 1 ? "y" : "ies"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={save}
              isLoading={saving}
              loadingText="Saving..."
            >
              Save Access
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminStudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axios.get(`/api/admin/students/${id}`),
      axios.get(`/api/results?studentId=${id}&limit=10`),
    ])
      .then(([s, a]) => {
        setStudent(s.data.data);
        setAttempts(a.data.data || []);
      })
      .catch(() => router.push("/admin/students"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const toggleStatus = async () => {
    if (!student) return;
    setToggling(true);
    try {
      const r = await axios.patch(`/api/admin/students/${id}`, { action: "toggle-status" });
      setStudent((prev: any) => ({ ...prev, isActive: r.data.data.isActive }));
      toast({
        title: r.data.data.isActive ? "Student activated" : "Student suspended",
        variant: "success",
      });
    } catch {
      toast({ title: "Failed to update status", variant: "error" });
    } finally {
      setToggling(false);
    }
  };

  const removeExam = async (categoryToRemove: string) => {
    const current = student?.assignedExams || student?.assignedCategories || [];
    const updated = current.filter((c: string) => c !== categoryToRemove);
    try {
      await axios.patch(`/api/admin/students/${id}`, {
        action: "assign-exams",
        assignedExams: updated,
        assignedCategories: updated,
      });
      setStudent((prev: any) => ({
        ...prev,
        assignedExams: updated,
        assignedCategories: updated,
      }));
      toast({
        title: `Removed ${categoryToRemove}`,
        variant: "success",
      });
    } catch {
      toast({ title: "Failed to remove exam", variant: "error" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded skeleton" />
        <div className="h-40 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const passedCount = attempts.filter((a) => a.isPassed).length;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, r) => a + (r.percentage || 0), 0) / attempts.length)
    : 0;
  const assignedCats = student.assignedExams || student.assignedCategories || [];
  const activeTime = student.lastActiveAt || student.lastActive;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/students")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* Student Header */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-black shrink-0">
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-display font-black text-foreground">{student.name}</h1>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    student.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {student.isActive ? "Active" : "Suspended"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{student.email}</span>
                {student.mobile && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{student.mobile}</span>}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {student.createdAt ? format(new Date(student.createdAt), "dd MMM yyyy") : "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Last Active: <strong className="text-foreground">{formatLastActive(activeTime)}</strong>
                  {activeTime && (
                    <span className="text-xs text-muted-foreground">({format(new Date(activeTime), "dd MMM yyyy, hh:mm a")})</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                className="gap-1.5"
              >
                <Tag className="h-4 w-4 text-primary" />
                Assign Exams
              </Button>
              <Button
                variant={student.isActive ? "outline" : "default"}
                size="sm"
                onClick={toggleStatus}
                isLoading={toggling}
                loadingText="Updating..."
                className={cn(
                  "gap-2 shrink-0",
                  student.isActive
                    ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
                id="toggle-student-status"
              >
                {student.isActive ? (
                  <><UserX className="h-4 w-4" />Suspend</>
                ) : (
                  <><UserCheck className="h-4 w-4" />Activate</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Exams Taken", value: attempts.length, icon: BookOpen, color: "text-blue-600" },
          { label: "Passed", value: passedCount, icon: Trophy, color: "text-green-600" },
          { label: "Avg Score", value: `${avgScore}%`, icon: Shield, color: "text-primary" },
          { label: "Assigned Exams", value: assignedCats.length, icon: Tag, color: "text-amber-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
              <Icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
              <p className={cn("text-xl font-display font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Assigned Exams Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Recent Exam Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No exam attempts yet</p>
            ) : (
              <div className="space-y-2">
                {attempts.slice(0, 6).map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm",
                        a.isPassed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {a.percentage ?? 0}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.examId?.title || "Exam"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.submittedAt ? format(new Date(a.submittedAt), "dd MMM yyyy") : ""}
                        {" · "}{a.timeTakenMinutes ?? 0} min
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded shrink-0",
                        a.isPassed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {a.isPassed ? "Pass" : "Fail"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Assigned Exams ({assignedCats.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryModal(true)}
              className="text-xs h-7 gap-1"
            >
              <Plus className="h-3 w-3" />
              Assign Exam
            </Button>
          </CardHeader>
          <CardContent>
            {assignedCats.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No exams assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This student currently has access to free exams only. Assign exam categories to grant access.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setShowCategoryModal(true)}
                  className="mt-3 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + Assign Exam
                </Button>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                <div className="flex flex-wrap gap-2">
                  {assignedCats.map((cat: string) => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium text-sm group"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => removeExam(cat)}
                        title={`Remove ${cat}`}
                        className="text-primary/60 hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add / Modify Assigned Exams
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <CategoryModal
            student={student}
            onClose={() => setShowCategoryModal(false)}
            onSaved={(newCats) =>
              setStudent((prev: any) => ({
                ...prev,
                assignedExams: newCats,
                assignedCategories: newCats,
              }))
            }
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
