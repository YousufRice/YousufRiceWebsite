import { NextResponse } from "next/server";
import webpush from "web-push";
import fs from "fs";
import path from "path";

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const DB_FILE = path.join(process.cwd(), "subscriptions.json");

export async function POST(req: Request) {
  try {
    const { title, body, url, icon } = await req.json();
    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: icon || "/logo.png",
    });

    // Load subscriptions from file
    let subs: any[] = [];
    if (fs.existsSync(DB_FILE)) {
      subs = JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
    }

    if (subs.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        message: "No subscriptions found",
      });
    }

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subs.map((sub) => webpush.sendNotification(sub, payload)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Clean up dead subscriptions (410 Gone)
    const deadEndpoints = results
      .map((r, i) =>
        r.status === "rejected" && (r as any).reason?.statusCode === 410
          ? subs[i].endpoint
          : null,
      )
      .filter(Boolean);

    if (deadEndpoints.length > 0) {
      subs = subs.filter((s: any) => !deadEndpoints.includes(s.endpoint));
      fs.writeFileSync(DB_FILE, JSON.stringify(subs, null, 2));
    }

    return NextResponse.json({
      sent: successful,
      failed,
      total: results.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
