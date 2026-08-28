export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const dns = await import("dns");
      dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);
      console.log("📡 [DNS] Configured Cloudflare and Google DNS servers for SRV lookups");
    } catch (err) {
      console.warn("⚠️ [DNS] Failed to set DNS servers:", err);
    }
  }
}
