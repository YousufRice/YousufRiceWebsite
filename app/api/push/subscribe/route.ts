import { NextResponse } from "next/server";
import { saveSubscription, checkRateLimit, validateSubscription } from "@/lib/push-production";

/**
 * Subscribe to push notifications
 * Rate limited: 10 requests per minute per IP
 */
export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Check rate limit
    const rateLimit = checkRateLimit(`subscribe:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Rate limit exceeded. Please try again later.",
          resetTime: rateLimit.resetTime,
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          }
        }
      );
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate subscription data
    const validation = validateSubscription(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Save subscription with additional metadata
    const subData = validation.data!;
    const result = await saveSubscription({
      endpoint: subData.endpoint!,
      p256dh: subData.p256dh!,
      auth: subData.auth!,
      user_id: subData.user_id,
      tags: subData.tags,
      user_agent: req.headers.get("user-agent") || null,
      ip_address: clientIp,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      isNew: result.isNew,
    }, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      }
    });
  } catch (error) {
    console.error("[Push API] Subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
