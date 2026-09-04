import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createOrderInput = z.object({ amountInr: z.number().positive().max(10_000_000) });

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator(createOrderInput)
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay test credentials are not configured on the server.");
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(data.amountInr * 100),
        currency: "INR",
        receipt: `merchant-ai-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order creation failed (${response.status}).`);
    }

    return (await response.json()) as {
      id: string;
      amount: number;
      currency: "INR";
      status: string;
    };
  });

export const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export async function loadRazorpayCheckout() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.head.appendChild(script);
  });

  return Boolean(window.Razorpay);
}

export async function openRazorpayCheckout(order: {
  id: string;
  amount: number;
  currency: string;
}): Promise<{ ok: boolean; paymentId: string; orderId: string; signature: string; error?: string }> {
  if (!razorpayKeyId) {
    return { ok: false, paymentId: "", orderId: order.id, signature: "", error: "Razorpay public test key is not configured." };
  }
  try {
    const loaded = await loadRazorpayCheckout();
    if (!loaded || !window.Razorpay) {
      return { ok: false, paymentId: "", orderId: order.id, signature: "", error: "Razorpay checkout could not be loaded." };
    }
    return await new Promise((resolve) => {
      const checkout = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "MerchantAI",
        description: "AI-assisted test checkout",
        order_id: order.id,
        handler: (response: { razorpay_payment_id?: string; razorpay_signature?: string }) =>
          resolve({
            ok: true,
            paymentId: response.razorpay_payment_id ?? "unknown",
            orderId: order.id,
            signature: response.razorpay_signature ?? "",
          }),
        modal: { ondismiss: () => resolve({ ok: false, paymentId: "", orderId: order.id, signature: "", error: "Checkout dismissed." }) },
      });
      checkout.open();
    });
  } catch (error) {
    return { ok: false, paymentId: "", orderId: order.id, signature: "", error: error instanceof Error ? error.message : "Checkout failed." };
  }
}
