import { NextResponse } from "next/server";
import { sendPushNotifications, verifyPushSecret, NotificationPayload, SendOptions } from "@/lib/push";

export async function POST(req: Request) {
  try {
    // Verify admin secret
    const secret = req.headers.get("x-push-secret");
    if (!secret || !verifyPushSecret(secret)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    const payload: NotificationPayload = {
      title: body.title,
      body: body.body,
      url: body.url || "/",
      icon: body.icon || "/logo.png",
      image: body.image,
      badge: body.badge || "/badge.png",
      tag: body.tag || "general",
      requireInteraction: body.requireInteraction ?? false,
      actions: body.actions || [{ action: "view", title: "View" }],
      data: body.data,
      ttl: body.ttl || 86400,
    };

    const options: SendOptions = {
      tags: body.tags,
      userIds: body.userIds,
      batchSize: body.batchSize || 100,
      batchDelayMs: body.batchDelayMs || 200,
    };

    const result = await sendPushNotifications(payload, options);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
