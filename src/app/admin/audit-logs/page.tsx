"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, AlertTriangle, Info, AlertCircle, X, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

const SEVERITY_CONFIG = {
  info:     { label: "Info",     color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    icon: Info },
  warning:  { label: "Warning",  color: "text-amber-600",  bg: "bg-amber-100 dark:bg-amber-900/30",  icon: AlertTriangle },
  error:    { label: "Error",    color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",      icon: AlertCircle },
  critical: { label: "Critical", color: "text-red-700",    bg: "bg-red-200 dark:bg-red-900/50",      icon: Shield },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "25",
      ...(severity !== "all" && { severity }),
    });
    axios
      .get(`/api/admin/audit-logs?${params}`)
      .then((r) => {
        setLogs(Array.isArray(r.data.data) ? r.data.data : []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, severity]);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.resource?.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Security and activity audit trail for platform events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Input
            id="log-search"
            placeholder="Search by action, resource, or user..."
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "info", "warning", "error", "critical"] as const).map((s) => {
            const count = s === "all" ? logs.length : logs.filter(l => l.severity === s).length;
            return (
              <Button
                key={s}
                variant={severity === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setSeverity(s); setPage(1); }}
                className="capitalize gap-1.5 text-xs"
              >
                {s}
                {count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    severity === s ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No audit logs matching selected filters</p>
              {(search || severity !== "all") && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => { setSearch(""); setSeverity("all"); }}
                  className="mt-2 text-gold-500"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((log) => {
                const sev = SEVERITY_CONFIG[(log.severity as keyof typeof SEVERITY_CONFIG) ?? "info"];
                const Icon = sev?.icon ?? Info;
                return (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors text-sm border border-transparent hover:border-border"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", sev?.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", sev?.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-foreground">{log.action}</span>
                        <span className="text-muted-foreground">on</span>
                        <span className="font-medium text-primary">{log.resource}</span>
                        {log.userName && (
                          <>
                            <span className="text-muted-foreground">by</span>
                            <span className="font-medium text-foreground">{log.userName}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-muted-foreground">
                        {log.ip && <span>IP: {log.ip}</span>}
                        {log.createdAt && (
                          <span>{format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")}</span>
                        )}
                      </div>
                    </div>
                    <span className={cn("text-xs font-medium shrink-0 px-1.5 py-0.5 rounded", sev?.bg, sev?.color)}>
                      {sev?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {total > 25 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(page + 1)}>
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

