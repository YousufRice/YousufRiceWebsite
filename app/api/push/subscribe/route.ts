import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "subscriptions.json");

function loadSubs() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveSubs(subs: any[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    const subs = loadSubs();

    // Avoid duplicates
    const exists = subs.find((s: any) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      saveSubs(subs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
