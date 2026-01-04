"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/features/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Digest } from "@/lib/db/schema";

export default function DigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDigest, setSelectedDigest] = useState<Digest | null>(null);
  const [filter, setFilter] = useState<"all" | "weekly" | "monthly">("all");

  useEffect(() => {
    fetchDigests();
  }, [filter]);

  const fetchDigests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("type", filter);
      }

      const response = await fetch(`/api/digests?${params}`);
      const data = await response.json();
      setDigests(data.digests);
    } catch (error) {
      console.error("Error fetching digests:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (digest: Digest) => {
    const start = new Date(digest.periodStart);
    const end = new Date(digest.periodEnd);

    if (digest.digestType === "weekly") {
      return `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Research Digests</h1>
          <p className="text-muted-foreground text-lg">
            Weekly and monthly summaries of cancer research progress
          </p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Digests</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : digests.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Digests Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No digests have been generated yet. Digests are created automatically:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Weekly digests:</strong> Generated every Sunday evening</li>
                <li>• <strong>Monthly digests:</strong> Generated on the 1st of each month</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Admins can also manually trigger digest generation from the Admin panel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Digest List */}
            <div className="lg:col-span-1 space-y-4">
              {digests.map((digest) => (
                <Card
                  key={digest.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDigest?.id === digest.id
                      ? "border-primary shadow-md"
                      : ""
                  }`}
                  onClick={() => setSelectedDigest(digest)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={
                          digest.digestType === "monthly"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {digest.digestType === "monthly" ? (
                          <Calendar className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        )}
                        {digest.digestType}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">
                      {formatPeriod(digest)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {digest.stats && typeof digest.stats === "object" && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {(digest.stats as any).totalEntries || 0} entries
                        </p>
                        <p>
                          {(digest.stats as any).breakthroughs || 0}{" "}
                          breakthroughs
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Digest Content */}
            <div className="lg:col-span-2">
              {selectedDigest ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={
                          selectedDigest.digestType === "monthly"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedDigest.digestType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(selectedDigest.createdAt)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl">
                      {selectedDigest.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriod(selectedDigest)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Highlights */}
                    {selectedDigest.highlights &&
                      Array.isArray(selectedDigest.highlights) &&
                      selectedDigest.highlights.length > 0 && (
                        <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                          <h3 className="font-semibold mb-3">
                            Key Highlights
                          </h3>
                          <ul className="space-y-2">
                            {selectedDigest.highlights.map(
                              (highlight: any, idx: number) => (
                                <li key={idx} className="text-sm">
                                  <span className="font-medium">
                                    {highlight.title}
                                  </span>
                                  {highlight.cancerTypes &&
                                    highlight.cancerTypes.length > 0 && (
                                      <span className="text-muted-foreground ml-2">
                                        ({highlight.cancerTypes.join(", ")})
                                      </span>
                                    )}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Statistics */}
                    {selectedDigest.stats &&
                      typeof selectedDigest.stats === "object" && (
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-secondary/30 rounded-lg">
                            <p className="text-2xl font-bold">
                              {(selectedDigest.stats as any).totalEntries || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total Entries
                            </p>
                          </div>
                          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                              {(selectedDigest.stats as any).breakthroughs || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Breakthroughs
                            </p>
                          </div>
                          {(selectedDigest.stats as any).significant && (
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {(selectedDigest.stats as any).significant}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Significant
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Main Content - Markdown rendered as HTML */}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedDigest.content
                            .replace(/^### /gm, "<h3>")
                            .replace(/^## /gm, "<h2>")
                            .replace(/^# /gm, "<h1>")
                            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                            .replace(/\*([^*]+)\*/g, "<em>$1</em>")
                            .replace(/^- /gm, "<li>")
                            .replace(/\n\n/g, "</p><p>")
                            .replace(/^(.+)$/gm, "<p>$1</p>")
                            .replace(/<p><li>/g, "<ul><li>")
                            .replace(/<\/li><\/p>/g, "</li></ul>"),
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Select a digest to view its contents
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
