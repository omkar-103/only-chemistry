"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Eye, BookOpen, ToggleLeft, ToggleRight, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DIFFICULTY_CONFIG, ROUTES, CURRENCY_SYMBOL } from "@/constants";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { toast } from "@/hooks/useToast";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchExams = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(), limit: "12",
      ...(search && { search }),
      ...(status !== "all" && { status }),
    });
    axios.get(`/api/exams?${params}`)
      .then(r => { setExams(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchExams(); }, [page, status]);
  useEffect(() => { const t = setTimeout(fetchExams, 400); return () => clearTimeout(t); }, [search]);

  const toggleStatus = async (exam: any) => {
    const newStatus = exam.status === "published" ? "draft" : "published";
    try {
      await axios.put(`/api/exams/${exam._id}`, { status: newStatus });
      setExams(prev => prev.map(e => e._id === exam._id ? { ...e, status: newStatus } : e));
      toast({ title: `Exam ${newStatus}`, variant: "success" });
    } catch { toast({ title: "Failed to update", variant: "error" }); }
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Delete this exam? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/exams/${id}`);
      setExams(prev => prev.filter(e => e._id !== id));
      toast({ title: "Exam deleted", variant: "success" });
    } catch { toast({ title: "Delete failed", variant: "error" }); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Exams</h1>
          <p className="text-muted-foreground text-sm">{total} total exams</p>
        </div>
        <Link href={ROUTES.ADMIN.EXAM_CREATE}>
          <Button variant="gold" size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Create Exam</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input id="exam-admin-search" placeholder="Search exams..." leftIcon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {["all", "published", "draft", "archived"].map(s => (
                <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => { setStatus(s); setPage(1); }} className="capitalize">{s}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)}</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No exams found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Title</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Price</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => {
                    const diff = DIFFICULTY_CONFIG[exam.difficulty as keyof typeof DIFFICULTY_CONFIG];
                    return (
                      <tr key={exam._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[160px]">{exam.title}</p>
                              <p className={cn("text-xs font-medium", diff?.color)}>{diff?.label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{exam.category}</td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          {exam.isFree
                            ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">FREE</span>
                            : <span className="text-sm font-medium">{CURRENCY_SYMBOL}{(exam.price / 100).toFixed(0)}</span>
                          }
                        </td>
                        <td className="py-3 px-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            exam.status === "published"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>
                            {exam.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/exams/${exam._id}`}>
                              <Button variant="ghost" size="icon-sm" title="View"><Eye className="h-4 w-4" /></Button>
                            </Link>
                            <Link href={`/admin/exams/${exam._id}/preview`}>
                              <Button variant="ghost" size="icon-sm" title="Preview as Student">
                                <Presentation className="h-4 w-4 text-indigo-500" />
                              </Button>
                            </Link>
                            <Link href={`/admin/exams/${exam._id}/edit`}>
                              <Button variant="ghost" size="icon-sm" title="Edit"><Pencil className="h-4 w-4" /></Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={exam.status === "published" ? "Unpublish" : "Publish"}
                              onClick={() => toggleStatus(exam)}
                            >
                              {exam.status === "published"
                                ? <ToggleRight className="h-4 w-4 text-green-600" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              }
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => deleteExam(exam._id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > 12 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 12)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
