import { NextResponse } from "next/server";
import { Client, TablesDB, Query } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const PUSH_LOG_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID || "push_notification_log";

function createClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_API_KEY || "");
  return new TablesDB(client);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription_id, action, url } = body;

    if (!subscription_id || !action) {
      return NextResponse.json(
        { success: false, error: "subscription_id and action are required" },
        { status: 400 }
      );
    }

    const tablesDB = createClient();

    // Find the most recent log entry for this subscription with sent/delivered status
    const logs = await tablesDB.listRows(
      DATABASE_ID,
      PUSH_LOG_TABLE_ID,
      [
        Query.equal("subscription_id", subscription_id),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    );

    if (logs.total === 0) {
      return NextResponse.json(
        { success: false, error: "No log entry found for this subscription" },
        { status: 404 }
      );
    }

    const logEntry = logs.rows[0];
    const now = new Date().toISOString();

    // Update the log entry based on the action
    if (action === "click") {
      await tablesDB.updateRow(DATABASE_ID, PUSH_LOG_TABLE_ID, logEntry.$id, {
        status: "clicked",
        clicked_at: now,
      });
    } else if (action === "dismiss") {
      await tablesDB.updateRow(DATABASE_ID, PUSH_LOG_TABLE_ID, logEntry.$id, {
        status: "dismissed",
        dismissed_at: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Track notification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to track notification" },
      { status: 500 }
    );
  }
}
