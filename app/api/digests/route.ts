import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digests } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/digests
 * List all digests with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // weekly or monthly
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = db.select().from(digests).orderBy(desc(digests.createdAt));

    if (type === "weekly" || type === "monthly") {
      query = query.where(eq(digests.digestType, type));
    }

    const results = await query.limit(limit);

    return NextResponse.json({
      digests: results,
      total: results.length,
    });
  } catch (error) {
    console.error("Error fetching digests:", error);
    return NextResponse.json(
      { error: "Failed to fetch digests" },
      { status: 500 }
    );
  }
}
