// POST /api/payments/create-order
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Exam from "@/lib/db/models/Exam";
import User from "@/lib/db/models/User";
import Payment from "@/lib/db/models/Payment";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";
import { createOrderSchema } from "@/lib/validators/schemas";
import { createRazorpayOrder, createDemoOrder, isRazorpayConfigured } from "@/lib/razorpay/client";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { examId } = validation.data;
    await connectDB();

    const exam = await Exam.findById(examId).lean();
    if (!exam || exam.status !== "published") {
      return errorResponse("Exam not found or not available", 404);
    }

    if (exam.isFree) {
      return errorResponse("This exam is free. No payment required.", 400);
    }

    // Check if already purchased
    const student = await User.findById(authResult.user.userId).lean();
    const alreadyPurchased = student?.purchasedExams?.some(
      (p) => p.toString() === examId
    );
    if (alreadyPurchased) {
      return errorResponse("You have already purchased this exam", 400);
    }

    const amount = exam.price; // already in paise
    const receipt = `receipt_${authResult.user.userId}_${examId}_${Date.now()}`;

    let order;
    if (isRazorpayConfigured()) {
      order = await createRazorpayOrder({
        amount,
        currency: "INR",
        receipt,
        notes: {
          examId,
          studentId: authResult.user.userId,
          examTitle: exam.title,
        },
      });
    } else {
      // Demo mode
      console.log("💳 [PAYMENT] Razorpay not configured — using demo mode");
      order = await createDemoOrder({ amount, examId, studentId: authResult.user.userId });
    }

    // Save payment record
    await Payment.create({
      studentId: authResult.user.userId,
      examId,
      orderId: order.id,
      amount,
      currency: "INR",
      status: "created",
    });

    return successResponse(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "demo",
        examTitle: exam.title,
        isDemoMode: !isRazorpayConfigured(),
      },
      "Order created successfully",
      201
    );
  } catch (error) {
    console.error("[CREATE ORDER] Error:", (error as Error).message);
    return errorResponse("Failed to create payment order", 500);
  }
}
