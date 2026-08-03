// ============================================================
// MongoDB Connection — with Auto In-Memory Server + Demo Seed
// ============================================================

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rhg-exam-portal";
const IS_DEV = process.env.NODE_ENV !== "production";

declare global {
  // eslint-disable-next-line no-var
  var __mongoCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    memServer: any | null;
    seeded: boolean;
  };
}

if (!global.__mongoCache) {
  global.__mongoCache = { conn: null, promise: null, memServer: null, seeded: false };
}
const cached = global.__mongoCache;

// ── Resolve the final URI (memory-server fallback for dev) ────
async function resolveURI(): Promise<string> {
  // Atlas SRV — use as-is
  if (MONGODB_URI.startsWith("mongodb+srv://")) {
    return MONGODB_URI;
  }

  // In dev with localhost URI → skip connection test, go straight to memory server
  if (IS_DEV) {
    if (!cached.memServer) {
      console.log("🧪 [DB] Starting In-Memory MongoDB (no install required)...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      cached.memServer = await MongoMemoryServer.create({
        instance: { dbName: "rhg-exam-portal" },
      });
      const uri = cached.memServer.getUri();
      console.log("✅ [DB] In-Memory MongoDB ready:", uri);
      console.log("💡 [DB] Demo credentials will be seeded automatically on first request.");
    }
    return cached.memServer.getUri();
  }

  return MONGODB_URI;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  cached.promise = (async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const uri = await resolveURI();
    const instance = await mongoose.connect(uri, {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    const dbName = instance.connection.db?.databaseName ?? "rhg-exam-portal";
    console.log(`✅ [DB] Connected — ${dbName}`);

    // Auto-seed demo data BEFORE returning — ensures accounts exist on first request
    // Note: We check DB for admin existence rather than a flag, because in-memory DB
    // is wiped on process restart while the module cache (seeded flag) can persist in dev.
    if (IS_DEV) {
      try {
        await seedDemoData();
      } catch (e: any) {
        console.warn("⚠️ [Seed] Failed:", e.message);
      }
    }

    setupHandlers(instance);
    return instance;
  })().catch((err) => {
    cached.promise = null;
    console.error("❌ [DB] Connection failed:", err.message);
    if (err.message.includes("ECONNREFUSED") || err.message.includes("querySrv")) {
      console.error("💡 [DB] Tip: Update MONGODB_URI in .env.local to a valid Atlas URI,");
      console.error("         or ensure MongoDB is running locally.");
    }
    throw err;
  });

  cached.conn = await cached.promise;
  return cached.conn;
}

// ── Auto-seed admin + demo student ────────────────────────────
async function seedDemoData() {
  const bcrypt = await import("bcryptjs");

  // Lazy-load models (they register themselves)
  const User = (await import("@/lib/db/models/User")).default;

  const adminExists = await User.findOne({ email: "admin@rhgconsultancy.com" });
  if (adminExists) {
    console.log("✅ [Seed] Demo data already exists — skipping.");
    return;
  }

  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash("Admin@RHG2024!", 10),
    bcrypt.hash("Demo@1234!", 10),
  ]);

  await User.insertMany([
    {
      name: "Admin RHG",
      email: "admin@rhgconsultancy.com",
      mobile: "9000000001",
      password: adminHash,
      role: "admin",
      isVerified: true,
      isActive: true,
      purchasedExams: [],
      totalTimeOnSite: 0,
      otpAttempts: 0,
    },
    {
      name: "Demo Student",
      email: "student@demo.com",
      mobile: "9000000002",
      password: studentHash,
      role: "student",
      isVerified: true,
      isActive: true,
      purchasedExams: [],
      totalTimeOnSite: 0,
      otpAttempts: 0,
    },
  ]);

  // Seed demo categories
  const Category = (await import("@/lib/db/models/Category")).default;
  const catData = [
    { name: "JEE Main",    icon: "⚛️", color: "#3B82F6", displayOrder: 1 },
    { name: "JEE Advanced",icon: "🔬", color: "#8B5CF6", displayOrder: 2 },
    { name: "GATE",        icon: "🎓", color: "#10B981", displayOrder: 3 },
    { name: "CSIR NET",    icon: "🧪", color: "#EF4444", displayOrder: 4 },
  ];
  await Category.insertMany(catData.map(c => ({ ...c, isActive: true, description: "" })));

  // Seed a demo published exam so the list is never empty
  const Exam = (await import("@/lib/db/models/Exam")).default;
  const admin = await User.findOne({ email: "admin@rhgconsultancy.com" });
  await Exam.create({
    title: "JEE Main Chemistry Mock Test — Demo",
    description: "A sample chemistry exam covering Organic, Inorganic and Physical Chemistry. This is a demo exam pre-loaded for testing.",
    category: "JEE Main",
    subject: "Chemistry",
    difficulty: "medium",
    isFree: true,
    price: 0,
    status: "published",
    totalDuration: 60,
    passingPercentage: 40,
    negativeMarkingEnabled: true,
    maxAttempts: 3,
    resultVisibility: "full",
    showExplanations: true,
    allowReattempt: true,
    autoDistributeTime: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    createdBy: admin!._id,
    questions: [
      {
        questionText: "Which of the following is the correct IUPAC name of CH₃-CH₂-CHO?",
        questionType: "single",
        options: [
          { id: "A", text: "Propanal" },
          { id: "B", text: "Propanone" },
          { id: "C", text: "Butanal" },
          { id: "D", text: "Ethanal" },
        ],
        correctAnswers: ["A"],
        marks: 4,
        negativeMarks: 1,
        explanation: "CH₃-CH₂-CHO has 3 carbons with an aldehyde group. The IUPAC name is Propanal (prop = 3C, an = single bond, al = aldehyde).",
        order: 0,
      },
      {
        questionText: "The hybridisation of carbon in CO₂ is:",
        questionType: "single",
        options: [
          { id: "A", text: "sp" },
          { id: "B", text: "sp²" },
          { id: "C", text: "sp³" },
          { id: "D", text: "sp³d" },
        ],
        correctAnswers: ["A"],
        marks: 4,
        negativeMarks: 1,
        explanation: "In CO₂, carbon forms 2 double bonds with oxygen. No lone pairs on C. So 2 regions of electron density → sp hybridisation.",
        order: 1,
      },
      {
        questionText: "Which of the following compounds shows optical isomerism?",
        questionType: "single",
        options: [
          { id: "A", text: "CH₃CH₂CH₂Cl" },
          { id: "B", text: "CH₃CHClCH₃" },
          { id: "C", text: "CH₃CH(OH)COOH" },
          { id: "D", text: "CH₂Cl₂" },
        ],
        correctAnswers: ["C"],
        marks: 4,
        negativeMarks: 1,
        explanation: "Lactic acid (CH₃CH(OH)COOH) has an asymmetric carbon (chiral centre) bonded to 4 different groups, so it shows optical isomerism.",
        order: 2,
      },
    ],
  });

  console.log("🌱 [Seed] Demo accounts created:");
  console.log("   👤 Admin  → admin@rhgconsultancy.com / Admin@RHG2024!");
  console.log("   👤 Student → student@demo.com / Demo@1234!");
}

function setupHandlers(mongooseInstance: typeof mongoose) {
  const conn = mongooseInstance.connection;
  conn.on("disconnected", () => { cached.conn = null; cached.promise = null; });
  conn.on("error", () => { cached.conn = null; cached.promise = null; });
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
