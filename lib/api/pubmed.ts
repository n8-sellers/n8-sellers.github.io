/**
 * PubMed/NCBI E-utilities API Integration
 * Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const PUBMED_SEARCH_URL = `${PUBMED_BASE_URL}/esearch.fcgi`;
const PUBMED_FETCH_URL = `${PUBMED_BASE_URL}/efetch.fcgi`;
const PUBMED_SUMMARY_URL = `${PUBMED_BASE_URL}/esummary.fcgi`;

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  url: string;
}

interface SearchParams {
  query: string;
  maxResults?: number;
  dateFrom?: string; // YYYY/MM/DD
  dateTo?: string; // YYYY/MM/DD
}

/**
 * Search PubMed for cancer research articles
 */
export async function searchPubMed({
  query,
  maxResults = 20,
  dateFrom,
  dateTo,
}: SearchParams): Promise<string[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: maxResults.toString(),
    retmode: "json",
    sort: "relevance",
  });

  if (dateFrom && dateTo) {
    params.append("mindate", dateFrom);
    params.append("maxdate", dateTo);
  }

  if (process.env.NCBI_API_KEY) {
    params.append("api_key", process.env.NCBI_API_KEY);
  }

  const response = await fetch(`${PUBMED_SEARCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

/**
 * Fetch article details by PubMed ID
 */
export async function fetchPubMedArticles(
  pmids: string[]
): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  const params = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
  });

  if (process.env.NCBI_API_KEY) {
    params.append("api_key", process.env.NCBI_API_KEY);
  }

  const response = await fetch(`${PUBMED_FETCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`PubMed fetch failed: ${response.statusText}`);
  }

  const xmlText = await response.text();
  return parseArticlesFromXML(xmlText);
}

/**
 * Parse PubMed XML response into structured article data
 */
function parseArticlesFromXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  // Simple XML parsing - in production, consider using a proper XML parser
  const articleMatches = xml.matchAll(
    /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g
  );

  for (const match of articleMatches) {
    const articleXml = match[1];

    const pmid = extractXMLValue(articleXml, "PMID");
    const title = extractXMLValue(articleXml, "ArticleTitle");
    const abstract = extractXMLValue(articleXml, "AbstractText");
    const journal = extractXMLValue(articleXml, "Title"); // Journal title
    const doi = extractXMLValue(articleXml, "ELocationID", 'EIdType="doi"');

    // Extract publication date
    const year = extractXMLValue(articleXml, "Year") || new Date().getFullYear().toString();
    const month = extractXMLValue(articleXml, "Month") || "01";
    const day = extractXMLValue(articleXml, "Day") || "01";
    const publicationDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Extract authors
    const authors: string[] = [];
    const authorMatches = articleXml.matchAll(
      /<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g
    );
    for (const authorMatch of authorMatches) {
      authors.push(`${authorMatch[2]} ${authorMatch[1]}`);
    }

    if (pmid && title) {
      articles.push({
        pmid,
        title: cleanHTMLEntities(title),
        abstract: cleanHTMLEntities(abstract || ""),
        authors,
        journal: cleanHTMLEntities(journal || ""),
        publicationDate,
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }
  }

  return articles;
}

/**
 * Extract value from XML tag
 */
function extractXMLValue(
  xml: string,
  tag: string,
  attribute?: string
): string {
  const attrPattern = attribute ? `\\s+${attribute}` : "";
  const pattern = new RegExp(
    `<${tag}${attrPattern}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const match = xml.match(pattern);
  return match ? match[1].trim() : "";
}

/**
 * Clean HTML entities from text
 */
function cleanHTMLEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ""); // Remove any HTML tags
}

/**
 * Get recent cancer research articles
 */
export async function getRecentCancerResearch(
  daysBack: number = 7
): Promise<PubMedArticle[]> {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - daysBack);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // Search for high-impact cancer research
  const query = `(cancer[Title/Abstract] OR neoplasm[Title/Abstract] OR tumor[Title/Abstract] OR carcinoma[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract] OR breakthrough[Title/Abstract] OR clinical trial[Title/Abstract]) AND (hasabstract[text]) AND ("loattrfull text"[sb] OR "loattrfree full text"[sb])`;

  const pmids = await searchPubMed({
    query,
    maxResults: 50,
    dateFrom: formatDate(pastDate),
    dateTo: formatDate(today),
  });

  return fetchPubMedArticles(pmids);
}
