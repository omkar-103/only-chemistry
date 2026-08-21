// ============================================================
// MongoDB Connection — Only Chemistry
// Connects to MongoDB Atlas using MONGODB_URI from environment
// ============================================================

import mongoose from "mongoose";

// ── Safe URI resolution (no in-memory fallback) ───────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ [DB] MONGODB_URI is not defined in environment variables.");
  console.error("   Add MONGODB_URI to your .env.local file.");
}

// Extract hostname for safe logging (no credentials exposed)
function getClusterHost(uri: string): string {
  try {
    // For SRV URIs: mongodb+srv://user:pass@cluster.host.net/db
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const atIndex = withoutScheme.indexOf("@");
    if (atIndex !== -1) {
      const hostPart = withoutScheme.slice(atIndex + 1);
      return hostPart.split("/")[0]; // just the cluster hostname
    }
    return "unknown-host";
  } catch {
    return "unknown-host";
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global.__mongoCache) {
  global.__mongoCache = { conn: null, promise: null };
}
const cached = global.__mongoCache;

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Wait for in-flight connection
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("[DB] MONGODB_URI environment variable is not set.");
  }

  const clusterHost = getClusterHost(MONGODB_URI);
  console.log(`🔄 [DB] Connecting to Atlas cluster: ${clusterHost}`);

  // Disconnect stale connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  cached.promise = mongoose
    .connect(MONGODB_URI, {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    })
    .then((instance) => {
      const dbName = instance.connection.db?.databaseName ?? "only-chemistry";
      console.log(`✅ [DB] Connected to Atlas — database: ${dbName}`);
      setupHandlers(instance);
      return instance;
    })
    .catch((err) => {
      cached.promise = null;
      const msg = (err as Error).message || String(err);
      console.error(`❌ [DB] Connection FAILED: ${msg}`);
      if (msg.includes("querySrv") || msg.includes("ENOTFOUND")) {
        console.error("   ⚠  DNS resolution failed. Check your internet connection.");
        console.error("   ⚠  Also verify that your IP is whitelisted in MongoDB Atlas Network Access.");
      }
      if (msg.includes("Authentication failed") || msg.includes("auth")) {
        console.error("   ⚠  Authentication failed. Verify MONGODB_USERNAME and MONGODB_PASSWORD.");
      }
      if (msg.includes("Server selection timed out")) {
        console.error("   ⚠  Atlas server not reachable. Check network access settings in Atlas.");
      }
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

function setupHandlers(mongooseInstance: typeof mongoose) {
  const conn = mongooseInstance.connection;
  conn.on("disconnected", () => {
    console.warn("⚠️  [DB] Disconnected from Atlas");
    cached.conn = null;
    cached.promise = null;
  });
  conn.on("error", (err) => {
    console.error("❌ [DB] Connection error:", err.message);
    cached.conn = null;
    cached.promise = null;
  });
  conn.on("reconnected", () => {
    console.log("🔄 [DB] Reconnected to Atlas");
  });
}

export async function checkDBHealth(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    return { status: "healthy", latency: Date.now() - start };
  } catch {
    return { status: "unhealthy" };
  }
}

export default connectDB;
