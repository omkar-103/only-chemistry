// ============================================================
// Date Formatting Helpers — Last Active & Activity Tracking
// ============================================================

/**
 * Returns a human-friendly representation of a last active timestamp:
 * e.g., "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "28 Aug 2026, 3:42 PM"
 */
export function formatLastActive(
  dateInput: Date | string | null | undefined
): string {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return "1 hour ago";
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) {
    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Yesterday, ${timeStr}`;
  }
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
