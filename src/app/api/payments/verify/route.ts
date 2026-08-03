// POST /api/payments/verify — Verify payment and unlock exam
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Payment from "@/lib/db/models/Payment";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";
import { requireAuth, successResponse, errorResponse, createAuditLog, getClientIP } from "@/lib/api/utils";
import { verifyPaymentSchema } from "@/lib/validators/schemas";
import { verifyRazorpaySignature, isRazorpayConfigured } from "@/lib/razorpay/client";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const ip = getClientIP(req);

  try {
    const body = await req.json();
    const validation = verifyPaymentSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, examId } = validation.data;

    await connectDB();

    // Find the payment record
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) return errorResponse("Payment record not found", 404);

    // Ensure this payment belongs to current user
    if (payment.studentId.toString() !== authResult.user.userId) {
      return errorResponse("Unauthorized", 403);
    }

    if (payment.status === "paid") {
      return errorResponse("Payment already processed", 400);
    }

    // Verify signature (skip in demo mode)
    if (isRazorpayConfigured()) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        await Payment.findByIdAndUpdate(payment._id, { status: "failed" });
        await createAuditLog({
          userId: authResult.user.userId,
          action: "PAYMENT_SIGNATURE_INVALID",
          resource: "Payment",
          resourceId: payment._id.toString(),
          ip,
          severity: "critical",
        });
        return errorResponse("Payment verification failed — invalid signature", 400);
      }
    } else {
      console.log("💳 [PAYMENT] Demo mode — skipping signature verification");
    }

    // Update payment status
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        paymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
    });

    // Unlock exam for student
    await User.findByIdAndUpdate(authResult.user.userId, {
      $addToSet: { purchasedExams: examId },
    });

    // Send notification
    const paymentDoc = await Payment.findById(payment._id).populate("examId", "title").lean() as any;
    await Notification.create({
      userId: authResult.user.userId,
      type: "payment_success",
      title: "Payment Successful!",
      message: `You have successfully purchased the exam. You can now start it anytime.`,
      link: `/exams/${examId}`,
    });

    await createAuditLog({
      userId: authResult.user.userId,
      userEmail: authResult.user.email,
      action: "PAYMENT_SUCCESS",
      resource: "Payment",
      resourceId: payment._id.toString(),
      ip,
      details: { examId, amount: payment.amount },
    });

    return successResponse(
      {
        examId,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
      },
      "Payment verified! Exam unlocked successfully."
    );
  } catch (error) {
    console.error("[VERIFY PAYMENT] Error:", (error as Error).message);
    return errorResponse("Payment verification failed", 500);
  }
}
