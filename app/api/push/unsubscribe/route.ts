import { NextResponse } from "next/server";
import { removeSubscription, checkRateLimit } from "@/lib/push-production";

/**
 * Unsubscribe from push notifications
 * Rate limited: 20 requests per minute per IP
 */
export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Check rate limit
    const rateLimit = checkRateLimit(`unsubscribe:${clientIp}`);
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

    // Parse body
    let body: { endpoint?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { endpoint } = body;

    // Validate endpoint
    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid endpoint is required" },
        { status: 400 }
      );
    }

    // Validate endpoint format (basic URL check)
    try {
      new URL(endpoint);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid endpoint URL format" },
        { status: 400 }
      );
    }

    const result = await removeSubscription(endpoint);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to remove subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
    }, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      }
    });
  } catch (error) {
    console.error("[Push API] Unsubscribe error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
