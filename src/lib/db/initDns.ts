// ============================================================
// Server-Side DNS Initializer for MongoDB SRV Lookups
//
// In Node.js on Windows, mongodb's connection_string uses dns.promises.resolve().
// Setting servers on a dedicated dns.promises.Resolver and routing
// dns.promises resolution through it guarantees fast, reliable SRV resolution
// without ECONNREFUSED errors from local 127.0.0.1 DNS stubs.
// ============================================================
import dns from "node:dns";

const DNS_SERVERS = ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"];

try {
  dns.setServers(DNS_SERVERS);
} catch {
  // ignore
}

try {
  const resolver = new dns.promises.Resolver();
  resolver.setServers(DNS_SERVERS);

  const origResolve = dns.promises.resolve.bind(dns.promises);
  (dns.promises as any).resolve = function (hostname: string, rrtype?: string) {
    return resolver.resolve(hostname, (rrtype as any) || "A").catch(() => {
      return (origResolve as any)(hostname, rrtype);
    });
  };

  const origResolveSrv = dns.promises.resolveSrv.bind(dns.promises);
  (dns.promises as any).resolveSrv = function (hostname: string) {
    return resolver.resolveSrv(hostname).catch(() => {
      return origResolveSrv(hostname);
    });
  };

  const origResolveTxt = dns.promises.resolveTxt.bind(dns.promises);
  (dns.promises as any).resolveTxt = function (hostname: string) {
    return resolver.resolveTxt(hostname).catch(() => {
      return origResolveTxt(hostname);
    });
  };
} catch (err) {
  console.warn("⚠️ [DNS] Failed to initialize custom DNS resolver:", err);
}
