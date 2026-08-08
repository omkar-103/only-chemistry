"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BookOpen, CreditCard, MessageSquare,
  PlayCircle, Tag, BarChart3, Shield, Settings, FlaskConical,
  Menu, X, LogOut, ChevronRight, Bell, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils/cn";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { label: "Dashboard",        href: ROUTES.ADMIN.DASHBOARD,      icon: LayoutDashboard },
      { label: "Students",         href: ROUTES.ADMIN.STUDENTS,       icon: Users },
      { label: "Exams",            href: ROUTES.ADMIN.EXAMS,          icon: BookOpen },
      { label: "Payments",         href: ROUTES.ADMIN.PAYMENTS,       icon: CreditCard },
    ]
  },
  {
    title: "Content & Support",
    items: [
      { label: "Student Doubts",   href: ROUTES.ADMIN.DOUBTS,         icon: MessageSquare },
      { label: "Learning Videos",  href: ROUTES.ADMIN.VIDEOS,         icon: PlayCircle },
      { label: "Categories",       href: ROUTES.ADMIN.CATEGORIES,     icon: Tag },
      { label: "Notifications",    href: ROUTES.ADMIN.NOTIFICATIONS,  icon: Bell },
    ]
  },
  {
    title: "System & Insights",
    items: [
      { label: "Session Monitor",  href: "/admin/sessions",            icon: Activity },
      { label: "Analytics",        href: ROUTES.ADMIN.ANALYTICS,      icon: BarChart3 },
      { label: "Audit Logs",       href: ROUTES.ADMIN.AUDIT_LOGS,     icon: Shield },
      { label: "Settings",         href: ROUTES.ADMIN.SETTINGS,       icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  // Close mobile sidebar on route change on narrow viewports
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);


  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Mobile Overlay ─────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────────── */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 flex flex-col",
          "w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-sm">
            <FlaskConical className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-sidebar-foreground flex items-center gap-1.5">
              RHG<span className="text-sidebar-primary">CS</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-sidebar-primary/20 text-sidebar-primary rounded">Admin</span>
            </div>
            <div className="text-xs text-sidebar-foreground/50">Exam & LMS Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary shadow-xs font-semibold"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary rounded-r-full" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 justify-start gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href={ROUTES.ADMIN.DASHBOARD} className="hover:text-foreground transition-colors">Admin</Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-none">
                  {NAV_SECTIONS.flatMap((s) => s.items).find((n) => n.href === pathname)?.label || "Dashboard"}
                </span>
              </div>
              <h1 className="text-sm font-bold text-foreground">
                {NAV_SECTIONS.flatMap((s) => s.items).find((n) => n.href === pathname)?.label || "Admin Panel"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>System Operational</span>
            </div>
            <Button variant="ghost" size="icon-sm" className="relative" asChild>
              <Link href={ROUTES.ADMIN.NOTIFICATIONS}>
                <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
