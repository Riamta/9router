import { NextResponse } from "next/server";
import { getUsageDb } from "@/lib/usageDb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    
    const db = await getUsageDb();
    const history = db.data?.history || [];
    
    // Get the most recent entries
    const recentHistory = history
      .slice(-limit)
      .reverse()
      .map(entry => ({
        timestamp: entry.timestamp,
        model: entry.model,
        provider: entry.provider,
        tokens: entry.tokens,
        cost: entry.cost || 0,
        status: entry.status || "success",
        connectionId: entry.connectionId
      }));
    
    return NextResponse.json({ history: recentHistory });
  } catch (error) {
    console.error("[API] Failed to get recent history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
