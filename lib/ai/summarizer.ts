import Anthropic from "@anthropic-ai/sdk";
import type { PubMedArticle } from "../api/pubmed";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ResearchAssessment {
  isSignificant: boolean;
  impactLevel: "breakthrough" | "significant" | "incremental" | "early_stage";
  cancerTypes: string[];
  treatmentCategory:
    | "immunotherapy"
    | "targeted_therapy"
    | "gene_therapy"
    | "screening_detection"
    | "prevention"
    | "surgical"
    | "radiation"
    | "combination"
    | "supportive_care"
    | "other";
  researchPhase:
    | "preclinical"
    | "phase_1"
    | "phase_2"
    | "phase_3"
    | "fda_review"
    | "approved"
    | "basic_research";
  summary: string;
  plainLanguageSummary: string;
  timeToImpact: string;
  implications: string[];
  confidenceScore: number;
  reasoning: string;
}

const ASSESSMENT_PROMPT = `You are an expert cancer researcher and medical communicator. Analyze the following research article and provide a comprehensive assessment.

Article Title: {title}
Authors: {authors}
Journal: {journal}
Publication Date: {publicationDate}
DOI: {doi}

Abstract:
{abstract}

Provide your assessment in the following JSON format:
{
  "isSignificant": boolean, // Is this significant enough to include in our database?
  "impactLevel": "breakthrough" | "significant" | "incremental" | "early_stage",
  "cancerTypes": string[], // e.g., ["breast", "lung", "pancreatic"]
  "treatmentCategory": "immunotherapy" | "targeted_therapy" | "gene_therapy" | "screening_detection" | "prevention" | "surgical" | "radiation" | "combination" | "supportive_care" | "other",
  "researchPhase": "preclinical" | "phase_1" | "phase_2" | "phase_3" | "fda_review" | "approved" | "basic_research",
  "summary": "2-3 sentence technical summary",
  "plainLanguageSummary": "2-3 sentence explanation for general audience (ELI5 style)",
  "timeToImpact": "e.g., '2-3 years', '5+ years', 'In trials now', 'Available now'",
  "implications": ["key takeaway 1", "key takeaway 2", ...],
  "confidenceScore": 0.0-1.0, // Your confidence in this assessment
  "reasoning": "Brief explanation of your assessment"
}

Guidelines:
- "breakthrough": Paradigm-shifting discoveries, FDA approvals, major clinical trial success
- "significant": Important advances, promising Phase 2/3 results, novel mechanisms
- "incremental": Useful but limited advances, early positive data, refinements
- "early_stage": Very preliminary, basic research, requires much more validation

- Only mark isSignificant=true if the research represents meaningful progress
- Be conservative with "breakthrough" - reserve for truly exceptional findings
- Plain language summaries should avoid jargon and be understandable to non-scientists
- Cancer types should be lowercase, specific (e.g., "non-small cell lung cancer" not just "lung")
- Implications should focus on "what this means" not "what they did"`;

/**
 * Analyze a research article and get AI assessment
 */
export async function assessResearchArticle(
  article: PubMedArticle
): Promise<ResearchAssessment | null> {
  try {
    const prompt = ASSESSMENT_PROMPT.replace("{title}", article.title)
      .replace("{authors}", article.authors.join(", ") || "Not available")
      .replace("{journal}", article.journal || "Not available")
      .replace("{publicationDate}", article.publicationDate || "Not available")
      .replace("{doi}", article.doi || "Not available")
      .replace("{abstract}", article.abstract || "Abstract not available");

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude response:", content.text);
      return null;
    }

    const assessment = JSON.parse(jsonMatch[0]) as ResearchAssessment;

    // Validate the assessment
    if (!assessment.isSignificant) {
      return null;
    }

    return assessment;
  } catch (error) {
    console.error("Error assessing article:", article.pmid, error);
    return null;
  }
}

/**
 * Batch assess multiple articles
 */
export async function assessMultipleArticles(
  articles: PubMedArticle[],
  concurrency: number = 3
): Promise<Array<{ article: PubMedArticle; assessment: ResearchAssessment }>> {
  const results: Array<{
    article: PubMedArticle;
    assessment: ResearchAssessment;
  }> = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    const assessments = await Promise.all(
      batch.map(async (article) => ({
        article,
        assessment: await assessResearchArticle(article),
      }))
    );

    // Filter out null assessments
    results.push(
      ...assessments.filter(
        (r): r is { article: PubMedArticle; assessment: ResearchAssessment } =>
          r.assessment !== null
      )
    );

    // Rate limiting: wait between batches
    if (i + concurrency < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Generate a weekly digest summary
 */
export async function generateWeeklyDigest(
  entries: Array<{
    title: string;
    summary: string;
    impactLevel: string;
    cancerTypes: string[];
    treatmentCategory: string;
    publishedAt: Date | null;
  }>
): Promise<{ title: string; content: string; highlights: any }> {
  const entriesText = entries
    .map(
      (e, i) =>
        `${i + 1}. [${e.impactLevel.toUpperCase()}] ${e.title}\n   Cancer types: ${e.cancerTypes.join(", ")}\n   Category: ${e.treatmentCategory}\n   Summary: ${e.summary}\n`
    )
    .join("\n");

  const prompt = `You are a medical research communicator. Review the following cancer research developments from the past week and create a compelling weekly digest.

Research Entries (${entries.length} total):
${entriesText}

Create a weekly digest with:
1. An engaging title
2. An executive summary (2-3 paragraphs)
3. Top 3-5 most significant developments with explanations
4. Emerging themes or patterns
5. Notable clinical trial updates if any
6. A "Looking Ahead" section

Format the content in Markdown. Be informative but accessible to non-scientists.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract top developments for highlights
  const highlights = entries
    .filter((e) => e.impactLevel === "breakthrough" || e.impactLevel === "significant")
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      impactLevel: e.impactLevel,
      cancerTypes: e.cancerTypes,
    }));

  return {
    title: "This Week in Cancer Research",
    content: content.text,
    highlights,
  };
}

/**
 * Generate a monthly recap
 */
export async function generateMonthlyRecap(
  entries: Array<{
    title: string;
    summary: string;
    impactLevel: string;
    cancerTypes: string[];
    treatmentCategory: string;
    researchPhase: string;
  }>,
  stats: {
    totalEntries: number;
    breakthroughs: number;
    byCancerType: Record<string, number>;
    byTreatmentCategory: Record<string, number>;
  }
): Promise<{ title: string; content: string; highlights: any }> {
  const prompt = `You are a medical research analyst. Create a comprehensive monthly recap of cancer research progress.

Statistics:
- Total research developments: ${stats.totalEntries}
- Breakthrough discoveries: ${stats.breakthroughs}
- Most researched cancer types: ${Object.entries(stats.byCancerType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => `${type} (${count})`)
    .join(", ")}
- Top treatment categories: ${Object.entries(stats.byTreatmentCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, count]) => `${cat} (${count})`)
    .join(", ")}

Create a monthly recap with:
1. An engaging title
2. Executive summary highlighting the month's significance
3. Breakthrough count and key discoveries
4. Progress by cancer type (focus on top 3-5)
5. Treatment category trends
6. "Ones to Watch" - early-stage research showing promise
7. Key statistics and data visualizations descriptions

Format in Markdown. Make it compelling and informative.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const highlights = entries
    .filter((e) => e.impactLevel === "breakthrough")
    .map((e) => ({
      title: e.title,
      cancerTypes: e.cancerTypes,
      treatmentCategory: e.treatmentCategory,
    }));

  return {
    title: "Monthly Cancer Research Recap",
    content: content.text,
    highlights,
  };
}
