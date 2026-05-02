import { NextResponse } from "next/server";
import { saveSubscription } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const subscription = await req.json();

    const result = await saveSubscription({
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      user_id: subscription.user_id || null,
      tags: subscription.tags || "",
      user_agent: subscription.user_agent || req.headers.get("user-agent") || "",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
