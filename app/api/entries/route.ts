import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchEntries } from "@/lib/db/schema";
import { desc, eq, and, or, ilike, sql, inArray } from "drizzle-orm";

/**
 * GET /api/entries
 * List research entries with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const impactLevel = searchParams.get("impactLevel");
    const cancerType = searchParams.get("cancerType");
    const treatmentCategory = searchParams.get("treatmentCategory");
    const researchPhase = searchParams.get("researchPhase");
    const sourceType = searchParams.get("sourceType");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where conditions
    const conditions = [eq(researchEntries.isVisible, true)];

    if (impactLevel) {
      conditions.push(eq(researchEntries.impactLevel, impactLevel as any));
    }

    if (cancerType) {
      conditions.push(
        sql`${cancerType} = ANY(${researchEntries.cancerTypes})`
      );
    }

    if (treatmentCategory) {
      conditions.push(
        eq(researchEntries.treatmentCategory, treatmentCategory as any)
      );
    }

    if (researchPhase) {
      conditions.push(
        eq(researchEntries.researchPhase, researchPhase as any)
      );
    }

    if (sourceType) {
      conditions.push(eq(researchEntries.sourceType, sourceType as any));
    }

    // Query database
    const entries = await db
      .select()
      .from(researchEntries)
      .where(and(...conditions))
      .orderBy(desc(researchEntries.publishedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(researchEntries)
      .where(and(...conditions));

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
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entries
 * Create a new research entry (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Simple admin authentication
    const authHeader = request.headers.get("authorization");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Insert entry
    const [entry] = await db
      .insert(researchEntries)
      .values({
        title: body.title,
        summary: body.summary,
        plainLanguageSummary: body.plainLanguageSummary,
        impactLevel: body.impactLevel,
        cancerTypes: body.cancerTypes,
        treatmentCategory: body.treatmentCategory,
        researchPhase: body.researchPhase,
        timeToImpact: body.timeToImpact,
        implications: body.implications,
        sourceUrl: body.sourceUrl,
        sourceType: body.sourceType,
        sourceName: body.sourceName,
        institutions: body.institutions,
        authors: body.authors,
        doi: body.doi,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        confidenceScore: body.confidenceScore,
        aiModelUsed: body.aiModelUsed,
      })
      .returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
