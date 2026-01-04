"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/features/navigation";
import { FilterSidebar } from "@/components/features/filter-sidebar";
import { ResearchEntryCard } from "@/components/features/research-entry-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import type { ResearchEntry } from "@/lib/db/schema";

export default function HomePage() {
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    impactLevel?: string;
    cancerType?: string;
    treatmentCategory?: string;
    researchPhase?: string;
  }>({});
  const [selectedEntry, setSelectedEntry] = useState<ResearchEntry | null>(
    null
  );

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.impactLevel) params.append("impactLevel", filters.impactLevel);
      if (filters.cancerType) params.append("cancerType", filters.cancerType);
      if (filters.treatmentCategory)
        params.append("treatmentCategory", filters.treatmentCategory);
      if (filters.researchPhase)
        params.append("researchPhase", filters.researchPhase);

      const response = await fetch(`/api/entries?${params}`);
      const data = await response.json();
      setEntries(data.entries);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchEntries();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/entries/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setEntries(data.entries);
    } catch (error) {
      console.error("Error searching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Cancer Research Developments
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay informed about meaningful progress in cancer research with
            AI-powered summaries
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search research entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No research entries found. Try adjusting your filters or search
                  query.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  If you're an admin, you can manually trigger a data fetch from
                  the Admin panel.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <ResearchEntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Entry Detail Modal - Will be implemented next */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">{selectedEntry.title}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm">{selectedEntry.summary}</p>
              </div>
              {selectedEntry.plainLanguageSummary && (
                <div>
                  <h3 className="font-semibold mb-2">Plain Language Summary</h3>
                  <p className="text-sm">{selectedEntry.plainLanguageSummary}</p>
                </div>
              )}
              {selectedEntry.implications &&
                selectedEntry.implications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Key Implications</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {selectedEntry.implications.map((impl, idx) => (
                        <li key={idx}>{impl}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <div className="flex gap-2 pt-4 border-t">
                <Button asChild>
                  <a
                    href={selectedEntry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read Original Source
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
