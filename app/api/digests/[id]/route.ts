import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { digests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/digests/[id]
 * Get a single digest by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [digest] = await db
      .select()
      .from(digests)
      .where(eq(digests.id, params.id))
      .limit(1);

    if (!digest) {
      return NextResponse.json({ error: "Digest not found" }, { status: 404 });
    }

    return NextResponse.json(digest);
  } catch (error) {
    console.error("Error fetching digest:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}
