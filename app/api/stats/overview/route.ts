import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries } from "@/lib/db/schema";
import { sql, eq, and, gte } from "drizzle-orm";

/**
 * GET /api/stats/overview
 * Get aggregated statistics for the analytics dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get("days") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Total entries
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(researchEntries)
      .where(eq(researchEntries.isVisible, true));

    // Entries in time period
    const [{ periodTotal }] = await db
      .select({ periodTotal: sql<number>`count(*)::int` })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      );

    // By impact level
    const impactLevelStats = await db
      .select({
        impactLevel: researchEntries.impactLevel,
        count: sql<number>`count(*)::int`,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      )
      .groupBy(researchEntries.impactLevel);

    // By treatment category
    const treatmentCategoryStats = await db
      .select({
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
      .groupBy(researchEntries.treatmentCategory);

    // By research phase
    const researchPhaseStats = await db
      .select({
        phase: researchEntries.researchPhase,
        count: sql<number>`count(*)::int`,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      )
      .groupBy(researchEntries.researchPhase);

    // By source type
    const sourceTypeStats = await db
      .select({
        sourceType: researchEntries.sourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      )
      .groupBy(researchEntries.sourceType);

    // Cancer types (flatten arrays and count)
    const cancerTypeResults = await db
      .select({
        cancerTypes: researchEntries.cancerTypes,
      })
      .from(researchEntries)
      .where(
        and(
          eq(researchEntries.isVisible, true),
          gte(researchEntries.publishedAt, cutoffDate)
        )
      );

    const cancerTypeCounts: Record<string, number> = {};
    cancerTypeResults.forEach((row) => {
      row.cancerTypes.forEach((type) => {
        cancerTypeCounts[type] = (cancerTypeCounts[type] || 0) + 1;
      });
    });

    const cancerTypeStats = Object.entries(cancerTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total,
      periodTotal,
      period: `Last ${daysBack} days`,
      impactLevel: impactLevelStats,
      treatmentCategory: treatmentCategoryStats,
      researchPhase: researchPhaseStats,
      sourceType: sourceTypeStats,
      cancerType: cancerTypeStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
