import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries, digests, fetchLogs } from "@/lib/db/schema";
import { generateWeeklyDigest } from "@/lib/ai/summarizer";
import { gte, eq } from "drizzle-orm";

/**
 * POST /api/cron/weekly-digest
 * Generate weekly digest (runs every Sunday evening)
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
        jobType: "weekly_digest",
        startedAt: startTime,
        sourcesQueried: ["database"],
        status: "success",
      })
      .returning();

    // Calculate date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Query entries from the past week
    const entries = await db
      .select({
        title: researchEntries.title,
        summary: researchEntries.summary,
        impactLevel: researchEntries.impactLevel,
        cancerTypes: researchEntries.cancerTypes,
        treatmentCategory: researchEntries.treatmentCategory,
        publishedAt: researchEntries.publishedAt,
      })
      .from(researchEntries)
      .where(
        gte(researchEntries.publishedAt, startDate)
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
        message: "No entries found for the past week",
        entriesProcessed: 0,
      });
    }

    // Generate digest using AI
    const digest = await generateWeeklyDigest(entries);

    // Calculate statistics
    const stats = {
      totalEntries: entries.length,
      breakthroughs: entries.filter((e) => e.impactLevel === "breakthrough")
        .length,
      significant: entries.filter((e) => e.impactLevel === "significant").length,
      byCancerType: entries.reduce((acc: Record<string, number>, entry) => {
        entry.cancerTypes.forEach((type) => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      }, {}),
      byTreatmentCategory: entries.reduce(
        (acc: Record<string, number>, entry) => {
          acc[entry.treatmentCategory] =
            (acc[entry.treatmentCategory] || 0) + 1;
          return acc;
        },
        {}
      ),
    };

    // Format period dates
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    // Save digest to database
    await db.insert(digests).values({
      digestType: "weekly",
      periodStart: formatDate(startDate),
      periodEnd: formatDate(endDate),
      title: digest.title,
      content: digest.content,
      highlights: digest.highlights,
      stats,
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
      periodStart: formatDate(startDate),
      periodEnd: formatDate(endDate),
      stats,
      duration: Date.now() - startTime.getTime(),
    });
  } catch (error: any) {
    console.error("Error generating weekly digest:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly digest", details: error.message },
      { status: 500 }
    );
  }
}
