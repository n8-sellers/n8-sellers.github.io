import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries, digests, fetchLogs, monthlyStats } from "@/lib/db/schema";
import { generateMonthlyRecap } from "@/lib/ai/summarizer";
import { gte, lt, eq, and } from "drizzle-orm";

/**
 * POST /api/cron/monthly-digest
 * Generate monthly digest (runs on the 1st of each month)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = new Date();

    // Create fetch log
    const [log] = await db
      .insert(fetchLogs)
      .values({
        jobType: "monthly_digest",
        startedAt: startTime,
        sourcesQueried: ["database"],
        status: "success",
      })
      .returning();

    // Calculate previous month's date range
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfPreviousMonth = new Date(
      firstDayOfCurrentMonth.getTime() - 1
    );

    // Query all entries from previous month
    const entries = await db
      .select({
        title: researchEntries.title,
        summary: researchEntries.summary,
        impactLevel: researchEntries.impactLevel,
        cancerTypes: researchEntries.cancerTypes,
        treatmentCategory: researchEntries.treatmentCategory,
        researchPhase: researchEntries.researchPhase,
      })
      .from(researchEntries)
      .where(
        and(
          gte(researchEntries.publishedAt, firstDayOfPreviousMonth),
          lt(researchEntries.publishedAt, firstDayOfCurrentMonth)
        )
      )
      .orderBy(researchEntries.publishedAt);

    if (entries.length === 0) {
      // Update log and return
      await db
        .update(fetchLogs)
        .set({
          completedAt: new Date(),
          candidatesFound: 0,
          entriesAdded: 0,
          status: "success",
        })
        .where(eq(fetchLogs.id, log.id));

      return NextResponse.json({
        success: true,
        message: "No entries found for the previous month",
        entriesProcessed: 0,
      });
    }

    // Calculate comprehensive statistics
    const byCancerType = entries.reduce(
      (acc: Record<string, number>, entry) => {
        entry.cancerTypes.forEach((type) => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      },
      {}
    );

    const byTreatmentCategory = entries.reduce(
      (acc: Record<string, number>, entry) => {
        acc[entry.treatmentCategory] = (acc[entry.treatmentCategory] || 0) + 1;
        return acc;
      },
      {}
    );

    const byResearchPhase = entries.reduce(
      (acc: Record<string, number>, entry) => {
        acc[entry.researchPhase] = (acc[entry.researchPhase] || 0) + 1;
        return acc;
      },
      {}
    );

    const stats = {
      totalEntries: entries.length,
      breakthroughs: entries.filter((e) => e.impactLevel === "breakthrough")
        .length,
      byCancerType,
      byTreatmentCategory,
    };

    // Generate digest using AI
    const digest = await generateMonthlyRecap(entries, stats);

    // Format period dates
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    // Save digest to database
    await db.insert(digests).values({
      digestType: "monthly",
      periodStart: formatDate(firstDayOfPreviousMonth),
      periodEnd: formatDate(lastDayOfPreviousMonth),
      title: digest.title,
      content: digest.content,
      highlights: digest.highlights,
      stats,
    });

    // Insert/update monthly stats
    await db
      .insert(monthlyStats)
      .values({
        month: formatDate(firstDayOfPreviousMonth),
        totalEntries: entries.length,
        breakthroughs: stats.breakthroughs,
        byCancerType,
        byTreatmentCategory,
        byResearchPhase,
        bySourceType: {},
        topInstitutions: {},
      })
      .onConflictDoUpdate({
        target: monthlyStats.month,
        set: {
          totalEntries: entries.length,
          breakthroughs: stats.breakthroughs,
          byCancerType,
          byTreatmentCategory,
          byResearchPhase,
        },
      });

    // Update fetch log
    await db
      .update(fetchLogs)
      .set({
        completedAt: new Date(),
        candidatesFound: entries.length,
        entriesAdded: 1,
        status: "success",
      })
      .where(eq(fetchLogs.id, log.id));

    return NextResponse.json({
      success: true,
      logId: log.id,
      entriesProcessed: entries.length,
      periodStart: formatDate(firstDayOfPreviousMonth),
      periodEnd: formatDate(lastDayOfPreviousMonth),
      stats,
      duration: Date.now() - startTime.getTime(),
    });
  } catch (error: any) {
    console.error("Error generating monthly digest:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly digest", details: error.message },
      { status: 500 }
    );
  }
}
