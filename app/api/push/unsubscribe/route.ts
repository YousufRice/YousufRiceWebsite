import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint is required" },
        { status: 400 }
      );
    }

    const result = await removeSubscription(endpoint);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to remove subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
