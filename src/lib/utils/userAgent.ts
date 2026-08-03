// ============================================================
// User-Agent Parser Utility
// ============================================================

export function parseUserAgent(
  userAgent: string,
  ip: string
): {
  device: string;
  browser: string;
  ip: string;
  location?: string;
} {
  let browser = "Unknown Browser";
  let device = "Desktop";

  if (!userAgent) return { device, browser, ip };

  // Detect browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match?.[1]?.split(".")[0] || ""}`;
  } else if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match?.[1]?.split(".")[0] || ""}`;
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/([\d.]+)/);
    browser = `Safari ${match?.[1]?.split(".")[0] || ""}`;
  } else if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match?.[1]?.split(".")[0] || ""}`;
  } else if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    browser = "Opera";
  }

  // Detect device
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    device = "Mobile";
  } else if (userAgent.includes("iPad") || userAgent.includes("Tablet")) {
    device = "Tablet";
  }

  return { device, browser, ip };
}
