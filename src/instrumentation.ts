export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const dns = await import("dns");
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
      console.log("📡 [DNS] Configured Google and Cloudflare DNS servers for SRV lookups");
    } catch (err) {
      console.warn("⚠️ [DNS] Failed to set DNS servers:", err);
    }
  }
}
