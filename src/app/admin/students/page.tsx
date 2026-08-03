"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, UserCheck, UserX, Eye, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchStudents = () => {
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
  };

  useEffect(() => { fetchStudents(); }, [page, filter]);
  useEffect(() => {
    const t = setTimeout(fetchStudents, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = async (id: string) => {
    try {
      const r = await axios.patch(`/api/admin/students/${id}`, { action: "toggle-status" });
      setStudents((prev) => prev.map((s) =>
        s._id === id ? { ...s, isActive: r.data.data.isActive } : s
      ));
    } catch { }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
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
              onChange={(e) => setSearch(e.target.value)}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden sm:table-cell">Mobile</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Joined</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Last Login</th>
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
                      <td className="py-3 px-2 text-muted-foreground hidden md:table-cell text-xs">
                        {student.createdAt ? format(new Date(student.createdAt), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell text-xs">
                        {student.lastLogin ? format(new Date(student.lastLogin), "dd MMM, HH:mm") : "Never"}
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
                          <Link href={`/admin/students/${student._id}`}>
                            <Button variant="ghost" size="icon-sm" title="View Profile">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/students/${student._id}/analytics`}>
                            <Button variant="ghost" size="icon-sm" title="View Analytics">
                              <BarChart2 className="h-4 w-4 text-indigo-500" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
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
          {total > 15 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page * 15 >= total} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
