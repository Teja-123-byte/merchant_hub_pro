import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const verifyInput = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(verifyInput)
  .handler(async ({ data }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay test credentials are not configured on the server.");
    }

    const expected = createHmac("sha256", secret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(data.signature, "hex");

    return {
      verified:
        expectedBuffer.length === receivedBuffer.length &&
        timingSafeEqual(expectedBuffer, receivedBuffer),
    };
  });
