import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries, fetchLogs } from "@/lib/db/schema";
import { getRecentCancerResearch } from "@/lib/api/pubmed";
import { assessMultipleArticles } from "@/lib/ai/summarizer";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/trigger
 * Manually trigger the daily fetch job
 */
export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const authHeader = request.headers.get("authorization");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const jobType = body.jobType || "daily";

    if (jobType !== "daily") {
      return NextResponse.json(
        { error: "Only daily fetch is supported for manual trigger" },
        { status: 400 }
      );
    }

    const startTime = new Date();

    // Create fetch log
    const [log] = await db
      .insert(fetchLogs)
      .values({
        jobType: "daily",
        startedAt: startTime,
        sourcesQueried: ["PubMed"],
        status: "success",
      })
      .returning();

    let candidatesFound = 0;
    let entriesAdded = 0;
    let duplicatesSkipped = 0;
    const errors: any[] = [];

    try {
      // Fetch recent articles from PubMed
      const articles = await getRecentCancerResearch(7);
      candidatesFound = articles.length;

      // Assess articles with AI
      const assessments = await assessMultipleArticles(articles);

      // Insert significant entries
      for (const { article, assessment } of assessments) {
        try {
          // Check for duplicates by DOI or title
          const existing = await db
            .select()
            .from(researchEntries)
            .where(
              article.doi
                ? eq(researchEntries.doi, article.doi)
                : eq(researchEntries.title, article.title)
            )
            .limit(1);

          if (existing.length > 0) {
            duplicatesSkipped++;
            continue;
          }

          // Insert entry
          await db.insert(researchEntries).values({
            title: article.title,
            summary: assessment.summary,
            plainLanguageSummary: assessment.plainLanguageSummary,
            impactLevel: assessment.impactLevel,
            cancerTypes: assessment.cancerTypes,
            treatmentCategory: assessment.treatmentCategory,
            researchPhase: assessment.researchPhase,
            timeToImpact: assessment.timeToImpact,
            implications: assessment.implications,
            sourceUrl: article.url,
            sourceType: "peer_reviewed",
            sourceName: article.journal,
            authors: article.authors,
            doi: article.doi,
            publishedAt: new Date(article.publicationDate),
            confidenceScore: assessment.confidenceScore.toString(),
            aiModelUsed: "claude-3-5-sonnet-20241022",
          });

          entriesAdded++;
        } catch (err: any) {
          errors.push({
            article: article.title,
            error: err.message,
          });
        }
      }
    } catch (err: any) {
      errors.push({
        stage: "fetching",
        error: err.message,
      });
    }

    // Update fetch log
    await db
      .update(fetchLogs)
      .set({
        completedAt: new Date(),
        candidatesFound,
        entriesAdded,
        duplicatesSkipped,
        errors: errors.length > 0 ? errors : null,
        status: errors.length > 0 ? "partial" : "success",
      })
      .where(eq(fetchLogs.id, log.id));

    return NextResponse.json({
      success: true,
      logId: log.id,
      candidatesFound,
      entriesAdded,
      duplicatesSkipped,
      errors,
      duration: Date.now() - startTime.getTime(),
    });
  } catch (error: any) {
    console.error("Error triggering job:", error);
    return NextResponse.json(
      { error: "Failed to trigger job", details: error.message },
      { status: 500 }
    );
  }
}
