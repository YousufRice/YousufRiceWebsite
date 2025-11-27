import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-admin";
import crypto from "crypto";

// Helper to calculate SHA256 hash
function calculateHash(basket_id: string, secured_key: string, merchant_id: string, err_code: string): string {
  // Formula: basket_id | secured_key | merchant_id | err_code
  const stringToHash = `${basket_id}|${secured_key}|${merchant_id}|${err_code}`;
  return crypto.createHash("sha256").update(stringToHash).digest("hex");
}

export async function POST(request: Request) {
  try {
    // PayFast sends data as Form Data or JSON? Guide says "URL payment information or notification is pushed...".
    // Usually IPNs are POST requests. Let's handle both JSON and FormData just in case.
    let data: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      // Fallback: try to parse query params if it's a GET (though guide says POST for checkout URL?)
      // Guide says: "There are two types of checkout URL immediate... or delayed..."
      // It implies a push notification.
      // Let's assume body parsing worked or it's empty.
    }

    console.log("PayFast IPN Received:", data);

    const {
      basket_id,
      transaction_id,
      err_code,
      err_msg,
      validation_hash, // The hash sent by PayFast
      order_date,
    } = data;

    if (!basket_id) {
      return NextResponse.json({ error: "Missing basket_id" }, { status: 400 });
    }

    const merchant_id = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
    const secured_key = process.env.PAYFAST_SECURED_KEY;

    if (!merchant_id || !secured_key) {
      console.error("Server configuration error: Missing PayFast credentials");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // 1. Verify Signature
    // Guide: "Value received from PayFast should match with your calculated hash for data integrity."
    const calculatedHash = calculateHash(basket_id, secured_key, merchant_id, err_code || "");
    
    // Note: Some gateways might send hash in uppercase or lowercase.
    if (validation_hash && validation_hash.toLowerCase() !== calculatedHash.toLowerCase()) {
      console.error("PayFast IPN Signature Mismatch:", {
        received: validation_hash,
        calculated: calculatedHash,
        stringToHash: `${basket_id}|${secured_key}|${merchant_id}|${err_code}`
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Update Order in Appwrite
    const { databases } = createAdminClient();
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const ordersTableId = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_TABLE_ID!;

    let onlinePaymentStatus = "failed";
    let orderStatus = "pending";

    // "000" or "00" means success
    if (err_code === "000" || err_code === "00") {
      onlinePaymentStatus = "paid";
      // Optional: Update main order status to 'accepted' or keep 'pending' for manual review
      // orderStatus = "accepted"; 
    } else {
      onlinePaymentStatus = "failed";
      console.warn("PayFast Transaction Failed:", err_code, err_msg);
    }

    await databases.updateDocument(
      databaseId,
      ordersTableId,
      basket_id, // basket_id is the Appwrite Order ID
      {
        online_payment_status: onlinePaymentStatus,
        transaction_id: transaction_id || "",
        // status: orderStatus, // Uncomment if you want to auto-accept
      }
    );

    return NextResponse.json({ status: "success", message: "IPN processed" });

  } catch (error: any) {
    console.error("PayFast IPN Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
