// ============================================================
// Razorpay Client & Utilities
// ============================================================

import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

/**
 * Create a Razorpay order via API
 */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: string;
}> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.description || "Failed to create Razorpay order");
  }

  return response.json();
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return expectedSignature === params.signature;
}

/**
 * Demo mode — create a mock order for testing without real Razorpay keys
 */
export async function createDemoOrder(params: {
  amount: number;
  examId: string;
  studentId: string;
}): Promise<{ id: string; amount: number; currency: string; status: string }> {
  const orderId = `order_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: orderId,
    amount: params.amount,
    currency: "INR",
    status: "created",
  };
}

export function isRazorpayConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET &&
    RAZORPAY_KEY_ID !== "rzp_test_your_key_id_here");
}
