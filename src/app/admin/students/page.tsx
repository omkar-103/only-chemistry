"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserCheck, UserX, Eye, BarChart2, Tag, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { toast } from "@/hooks/useToast";

// ── Category Assignment Modal ─────────────────────────────────
function CategoryModal({
  student,
  onClose,
  onSaved,
}: {
  student: any;
  onClose: () => void;
  onSaved: (id: string, categories: string[]) => void;
}) {
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>(student.assignedCategories || []);
  const [saving, setSaving] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/categories?limit=100")
      .then(r => setAllCategories(r.data.data || []))
      .catch(() => setAllCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const toggle = (name: string) =>
    setSelected(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/students/${student._id}`, {
        action: "assign-categories",
        assignedCategories: selected,
      });
      toast({ title: "Categories updated", description: `${selected.length} categor${selected.length === 1 ? "y" : "ies"} assigned to ${student.name}`, variant: "success" });
      onSaved(student._id, selected);
      onClose();
    } catch {
      toast({ title: "Failed to update categories", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-black text-foreground text-lg">Assign Categories</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{student.name}</span> · {student.email}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories list */}
        <div className="p-5 max-h-72 overflow-y-auto">
          {loadingCats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : allCategories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              No categories found. Create them in{" "}
              <Link href="/admin/categories" className="text-primary hover:underline">Admin → Categories</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {allCategories.map((cat: any) => {
                const isSelected = selected.includes(cat.name);
                return (
                  <button
                    key={cat._id}
                    onClick={() => toggle(cat.name)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-lg shrink-0">{cat.icon || "📚"}</span>
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {selected.length} categor{selected.length === 1 ? "y" : "ies"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="gold" size="sm" onClick={save} isLoading={saving} loadingText="Saving...">
              Save Access
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalStudent, setModalStudent] = useState<any | null>(null);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      ...(search && { search }),
      ...(filter !== "all" && { isActive: filter === "active" ? "true" : "false" }),
    });
    axios.get(`/api/admin/students?${params}`)
      .then((r) => {
        setStudents(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleStatus = async (id: string) => {
    try {
      const r = await axios.patch(`/api/admin/students/${id}`, { action: "toggle-status" });
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isActive: r.data.data.isActive } : s));
    } catch { }
  };

  const onCategoriesSaved = (id: string, categories: string[]) => {
    setStudents(prev => prev.map(s => s._id === id ? { ...s, assignedCategories: categories } : s));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm">{total} total registered students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="student-search"
              placeholder="Search by name, email, or mobile..."
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1"
            />
            <div className="flex gap-2">
              {(["all", "active", "suspended"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setFilter(f); setPage(1); }}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl skeleton" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No students found</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1 rounded-xl">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden sm:table-cell">Mobile</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Categories</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {student.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[120px]">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{student.mobile}</td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(student.assignedCategories || []).length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">None assigned</span>
                          ) : (
                            (student.assignedCategories as string[]).slice(0, 2).map(cat => (
                              <span key={cat} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                                {cat}
                              </span>
                            ))
                          )}
                          {(student.assignedCategories || []).length > 2 && (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full">
                              +{student.assignedCategories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell text-xs">
                        {student.createdAt ? format(new Date(student.createdAt), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          student.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {student.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          {/* Assign Categories */}
                          <Button
                            variant="ghost" size="icon-sm"
                            title="Assign Categories"
                            onClick={() => setModalStudent(student)}
                          >
                            <Tag className="h-4 w-4 text-primary" />
                          </Button>
                          {/* View Profile */}
                          <Link href={`/admin/students/${student._id}`}>
                            <Button variant="ghost" size="icon-sm" title="View Profile">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {/* View Analytics */}
                          <Link href={`/admin/students/${student._id}/analytics`}>
                            <Button variant="ghost" size="icon-sm" title="View Analytics">
                              <BarChart2 className="h-4 w-4 text-indigo-500" />
                            </Button>
                          </Link>
                          {/* Toggle Status */}
                          <Button
                            variant="ghost" size="icon-sm"
                            title={student.isActive ? "Suspend" : "Activate"}
                            onClick={() => toggleStatus(student._id)}
                          >
                            {student.isActive
                              ? <UserX className="h-4 w-4 text-red-500" />
                              : <UserCheck className="h-4 w-4 text-green-500" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{total === 0 ? 0 : (page - 1) * 15 + 1}</strong> to{" "}
              <strong className="text-foreground">{Math.min(page * 15, total)}</strong> of{" "}
              <strong className="text-foreground">{total}</strong> students
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="h-8 px-2.5 text-xs">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page * 15 >= total || loading} onClick={() => setPage(page + 1)} className="h-8 px-2.5 text-xs">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Assignment Modal */}
      <AnimatePresence>
        {modalStudent && (
          <CategoryModal
            student={modalStudent}
            onClose={() => setModalStudent(null)}
            onSaved={onCategoriesSaved}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
