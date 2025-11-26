import crypto from "crypto";
import { databases, DATABASE_ID, ORDERS_TABLE_ID } from "@/lib/appwrite";

export async function GET(req) {
  return handleIPN(req);
}

export async function POST(req) {
  return handleIPN(req);
}

async function handleIPN(req) {
  try {
    const { searchParams } = new URL(req.url);

    const params = {
      transaction_id: searchParams.get("transaction_id"),
      err_code: searchParams.get("err_code"),
      err_msg: searchParams.get("err_msg"),
      basket_id: searchParams.get("basket_id"),
      order_date: searchParams.get("order_date"),
      validation_hash: searchParams.get("validation_hash"),
      paymentName: searchParams.get("paymentName"),
      transaction_amount: searchParams.get("transaction_amount"),
      merchant_amount: searchParams.get("merchant_amount"),
      transaction_currency: searchParams.get("transaction_currency"),
      discounted_amount: searchParams.get("discounted_amount"),
      instrument_token: searchParams.get("instrument_token"),
    };

    // Your merchant details (from .env)
    const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
    const securedKey = process.env.PAYFAST_SECURED_KEY;

    // Build string for hashing (PayFast documentation)
    const rawString = `${params.basket_id}|${securedKey}|${merchantId}|${params.err_code}`;

    // Generate hash
    const calculatedHash = crypto
      .createHash("sha256")
      .update(rawString)
      .digest("hex");

    const isHashValid =
      calculatedHash.toLowerCase() ===
      (params.validation_hash || "").toLowerCase();

    // ❌ Hash mismatch — reject silently (but return 200)
    if (!isHashValid) {
      console.log("❌ PayFast IPN: Invalid Hash", {
        expected: calculatedHash,
        received: params.validation_hash,
      });

      return Response.json({ status: "invalid_hash" });
    }

    // Hash correct → Payment info is trusted
    let paymentStatus = "failed";

    if (params.err_code === "000" || params.err_code === "00") {
      paymentStatus = "success";
    }

    // Update order in database
    if (params.basket_id) {
        try {
            // Map PayFast status to our order status
            let newStatus = "pending";
            let onlinePaymentStatus = "failed";
            
            if (paymentStatus === "success") {
                newStatus = "processing";
                onlinePaymentStatus = "paid";
            } else {
                newStatus = "cancelled";
                onlinePaymentStatus = "failed";
            }

            await databases.updateDocument(
                DATABASE_ID,
                ORDERS_TABLE_ID,
                params.basket_id,
                {
                    status: newStatus,
                    online_payment_status: onlinePaymentStatus,
                    transaction_id: params.transaction_id
                }
            );
             console.log(`✅ Order ${params.basket_id} updated to ${newStatus}, payment: ${onlinePaymentStatus}`);
        } catch (dbError) {
             console.error("❌ Failed to update order status:", dbError);
        }
    }

    console.log("✅ PayFast IPN Received:", {
      basket_id: params.basket_id,
      status: paymentStatus,
      err_code: params.err_code,
      msg: params.err_msg,
    });

    // PayFast requires ALWAYS returning 200 OK
    return Response.json({ status: paymentStatus });
  } catch (error) {
    console.log("❌ PayFast IPN Error:", error);

    // Still must return 200
    return Response.json({ status: "error" });
  }
}
