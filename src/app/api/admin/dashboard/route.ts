// GET /api/admin/dashboard — Dashboard stats for admin
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import Exam from "@/lib/db/models/Exam";
import Payment from "@/lib/db/models/Payment";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import Doubt from "@/lib/db/models/Doubt";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      activeStudents,
      totalExams,
      publishedExams,
      revenueData,
      recentPayments,
      totalAttempts,
      pendingDoubts,
      studentGrowth,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", lastLogin: { $gte: sevenDaysAgo } }),
      Exam.countDocuments(),
      Exam.countDocuments({ status: "published" }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Payment.find({ status: "paid" })
        .populate("studentId", "name email")
        .populate("examId", "title")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ExamAttempt.countDocuments({ status: { $ne: "in_progress" } }),
      Doubt.countDocuments({ status: "pending" }),
      // Monthly student registrations (last 6 months)
      User.aggregate([
        { $match: { role: "student", createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const revenueChart = monthlyRevenue.map((r) => ({
      month: months[r._id.month - 1],
      revenue: r.revenue / 100, // paise to rupees
      transactions: r.transactions,
    }));

    const growthChart = studentGrowth.map((s: any) => ({
      month: months[s._id.month - 1],
      students: s.count,
    }));

    const totalRevenue = revenueData[0]?.total || 0;

    const avgScoreResult = await ExamAttempt.aggregate([
      { $match: { status: { $in: ["submitted", "auto_submitted"] }, percentage: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: "$percentage" } } },
    ]);

    return successResponse(
      {
        totalStudents,
        activeStudents,
        totalExams,
        publishedExams,
        totalRevenue: totalRevenue / 100,
        recentPayments,
        examAttempts: totalAttempts,
        averageScore: Math.round(avgScoreResult[0]?.avgScore || 0),
        pendingDoubts,
        revenueData: revenueChart,
        studentGrowth: growthChart,
      },
      "Dashboard stats fetched"
    );
  } catch (error) {
    console.error("[ADMIN DASHBOARD] Error:", (error as Error).message);
    return errorResponse("Failed to fetch dashboard stats", 500);
  }
}
