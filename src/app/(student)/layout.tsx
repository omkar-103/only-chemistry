"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Trophy, PlayCircle, MessageSquare,
  User, FlaskConical, Menu, X, LogOut, Bell,
  ChevronRight, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils/cn";
import axios from "axios";

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/dashboard",      icon: LayoutDashboard },
  { label: "Exams",           href: "/exams",          icon: BookOpen },
  { label: "Results",         href: "/results",        icon: Trophy },
  { label: "Learning Videos", href: "/videos",         icon: PlayCircle },
  { label: "My Doubts",       href: "/doubts",         icon: MessageSquare },
  { label: "Notifications",   href: "/notifications",  icon: Bell },
  { label: "Profile",         href: "/profile",        icon: User },
];

// ── Notification Dropdown ─────────────────────────────────────
function NotificationDropdown({ unreadCount, onClose }: { unreadCount: number; onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get("/api/notifications?limit=5")
      .then(r => {
        const d = r.data.data;
        setNotifs(Array.isArray(d?.notifications) ? d.notifications : Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const markAllRead = () => {
    axios.patch("/api/notifications").catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm text-foreground">Notifications</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-border">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No notifications yet
          </div>
        ) : notifs.map(n => (
          <div key={n._id} className={cn("px-4 py-3 hover:bg-muted/50 transition-colors", !n.isRead && "bg-primary/5")}>
            <div className="flex items-start gap-2">
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              <div className={!n.isRead ? "" : "ml-4"}>
                <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <Link href="/notifications" onClick={onClose}>
          <Button variant="outline" size="sm" className="w-full text-xs">
            View All Notifications
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main Student Layout ───────────────────────────────────────
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [darkMode, setDarkMode]               = useState(false);
  const [showLoginPopup, setShowLoginPopup]   = useState(false);
  const loginPopupShownRef                    = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (user?.role === "admin") router.push("/admin");
  }, [isAuthenticated, user, router]);

  // Fetch unread count — and show login popup once per session
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = () =>
      axios.get("/api/notifications?limit=1")
        .then(r => {
          const count = r.data.data?.unreadCount ?? 0;
          setUnreadCount(count);
          // Show popup only once per session when there are unread notifications
          if (count > 0 && !loginPopupShownRef.current) {
            loginPopupShownRef.current = true;
            setTimeout(() => setShowLoginPopup(true), 1500);
          }
        })
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Dark mode toggle
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!isAuthenticated || user?.role !== "student") return null;

  const currentPage = NAV_ITEMS.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "Student Portal";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Mobile overlay ─────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────── */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 shrink-0",
        "bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg">
            <FlaskConical className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-sidebar-foreground leading-none">
              Only<span className="text-sidebar-primary">Chemistry</span>
            </div>
            <div className="text-[11px] text-sidebar-foreground/50 mt-0.5">Student Portal</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon size={17} className="shrink-0" />
                <span>{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isActive && item.href !== "/notifications" && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
              <div className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="w-full text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 justify-start gap-2 rounded-xl"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md shrink-0 gap-3">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost" size="icon-sm"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              id="mobile-sidebar-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground hidden sm:block">Student Portal</p>
              <h1 className="text-sm font-semibold text-foreground truncate">{currentPage}</h1>
            </div>
          </div>

          {/* Right: search hint, dark mode, bell, avatar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon-sm" onClick={toggleDark} title="Toggle theme">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Notification bell */}
            <div className="relative">
              <Button
                variant="ghost" size="icon-sm"
                className="relative"
                onClick={() => setShowNotifDropdown(v => !v)}
                id="notif-bell"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {showNotifDropdown && (
                  <NotificationDropdown
                    unreadCount={unreadCount}
                    onClose={() => setShowNotifDropdown(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <Link href="/profile" className="ml-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {/* ── Login Notification Popup ─────────────────────── */}
      <AnimatePresence>
        {showLoginPopup && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {unreadCount === 1 ? "1 new notification" : `${unreadCount} new notifications`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have unread messages waiting for you.
                </p>
              </div>
              <button
                onClick={() => setShowLoginPopup(false)}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <Link href="/notifications" className="flex-1" onClick={() => setShowLoginPopup(false)}>
                <Button variant="gold" size="sm" className="w-full gap-1.5 text-xs">
                  <Bell className="h-3.5 w-3.5" /> Open Notifications
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowLoginPopup(false)}
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
