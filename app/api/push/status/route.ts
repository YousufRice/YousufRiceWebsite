import { NextResponse } from "next/server";
import { Client, TablesDB, Query } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const PUSH_SUBSCRIPTIONS_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID || "push_subscriptions";

function createClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_API_KEY || "");
  return new TablesDB(client);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "endpoint query param is required" },
        { status: 400 }
      );
    }

    const tablesDB = createClient();

    const existing = await tablesDB.listRows(
      DATABASE_ID,
      PUSH_SUBSCRIPTIONS_TABLE_ID,
      [Query.equal("endpoint", endpoint)]
    );

    if (existing.total === 0) {
      return NextResponse.json({ exists: false, active: false });
    }

    const sub = existing.rows[0] as any;

    return NextResponse.json({
      exists: true,
      active: sub.status === "active",
      status: sub.status,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
