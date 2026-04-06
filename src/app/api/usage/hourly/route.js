import { NextResponse } from "next/server";
import { getHourlyActivity } from "@/lib/usageDb";

export async function GET() {
  try {
    const data = await getHourlyActivity();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Failed to get hourly activity:", error);
    return NextResponse.json({ error: "Failed to fetch hourly activity" }, { status: 500 });
  }
}
