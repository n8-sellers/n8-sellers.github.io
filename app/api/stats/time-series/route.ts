import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries } from "@/lib/db/schema";
import { sql, eq, and, gte } from "drizzle-orm";

/**
 * GET /api/stats/time-series
 * Get time series data for charts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get("days") || "90");
    const groupBy = searchParams.get("groupBy") || "week"; // day, week, month

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Determine date truncation based on groupBy
    let dateTrunc = "week";
    if (groupBy === "day") dateTrunc = "day";
    if (groupBy === "month") dateTrunc = "month";

    // Get entries grouped by time period
    const timeSeriesData = await db
      .select({
        period: sql<string>`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`,
        total: sql<number>`count(*)::int`,
        breakthroughs: sql<number>`count(*) FILTER (WHERE ${researchEntries.impactLevel} = 'breakthrough')::int`,
        significant: sql<number>`count(*) FILTER (WHERE ${researchEntries.impactLevel} = 'significant')::int`,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      )
      .groupBy(sql`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`)
      .orderBy(sql`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`);

    // Get treatment category trends over time
    const treatmentTrends = await db
      .select({
        period: sql<string>`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`,
        category: researchEntries.treatmentCategory,
        count: sql<number>`count(*)::int`,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      )
      .groupBy(
        sql`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`,
        researchEntries.treatmentCategory
      )
      .orderBy(sql`date_trunc(${dateTrunc}, ${researchEntries.publishedAt})`);

    return NextResponse.json({
      timeSeries: timeSeriesData,
      treatmentTrends,
      groupBy,
      daysBack,
    });
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return NextResponse.json(
      { error: "Failed to fetch time series data" },
      { status: 500 }
    );
  }
}
