"use client";

import { Navigation } from "@/components/features/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DigestsPage() {
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

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Weekly and monthly digests will be available once automated jobs
              are configured. These digests will provide comprehensive summaries
              of recent cancer research developments, highlighting breakthroughs
              and emerging trends.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
