import { NextResponse } from "next/server";
import { sendPushNotifications } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: "title and body required" },
        { status: 400 },
      );
    }

    const result = await sendPushNotifications({
      title: body.title,
      body: body.body,
      url: body.url || "/",
      icon: body.icon || "/logo.png",
      tag: body.tag || "general",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Push API] Send error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send" },
      { status: 500 },
    );
  }
}
