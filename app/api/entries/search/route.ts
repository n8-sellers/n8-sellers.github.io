import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries } from "@/lib/db/schema";
import { desc, eq, and, or, ilike, sql } from "drizzle-orm";

/**
 * GET /api/entries/search?q=query
 * Full-text search for research entries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ entries: [], pagination: { total: 0, limit, offset, hasMore: false } });
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    // Search in title, summary, and plain language summary
    const entries = await db
      .select()
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          or(
            sql`LOWER(${researchEntries.title}) LIKE ${searchTerm}`,
            sql`LOWER(${researchEntries.summary}) LIKE ${searchTerm}`,
            sql`LOWER(${researchEntries.plainLanguageSummary}) LIKE ${searchTerm}`
          )
        )
      )
      .orderBy(desc(researchEntries.publishedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          or(
            sql`LOWER(${researchEntries.title}) LIKE ${searchTerm}`,
            sql`LOWER(${researchEntries.summary}) LIKE ${searchTerm}`,
            sql`LOWER(${researchEntries.plainLanguageSummary}) LIKE ${searchTerm}`
          )
        )
      );

    return NextResponse.json({
      entries,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
    });
  } catch (error) {
    console.error("Error searching entries:", error);
    return NextResponse.json(
      { error: "Failed to search entries" },
      { status: 500 }
    );
  }
}
