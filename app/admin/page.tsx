"use client";

import { useState } from "react";
import { Navigation } from "@/components/features/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [resultDaily, setResultDaily] = useState<any>(null);
  const [resultWeekly, setResultWeekly] = useState<any>(null);
  const [resultMonthly, setResultMonthly] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check - real auth happens on API calls
    setAuthenticated(true);
  };

  const triggerDailyFetch = async () => {
    setLoadingDaily(true);
    setError(null);
    setResultDaily(null);

    try {
      const response = await fetch("/api/admin/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ jobType: "daily" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger job");
      }

      setResultDaily(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  const triggerWeeklyDigest = async () => {
    setLoadingWeekly(true);
    setError(null);
    setResultWeekly(null);

    try {
      const response = await fetch("/api/cron/weekly-digest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate weekly digest");
      }

      setResultWeekly(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const triggerMonthlyDigest = async () => {
    setLoadingMonthly(true);
    setError(null);
    setResultMonthly(null);

    try {
      const response = await fetch("/api/cron/monthly-digest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate monthly digest");
      }

      setResultMonthly(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMonthly(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-lg">
            Manage research data and run jobs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Data Fetch */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Data Fetch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Trigger a manual fetch of recent cancer research articles from
                PubMed. The AI will assess each article and add significant
                findings to the database.
              </p>

              <Button
                onClick={triggerDailyFetch}
                disabled={loadingDaily}
                className="w-full"
              >
                {loadingDaily ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Trigger Daily Fetch
                  </>
                )}
              </Button>

              {resultDaily && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Fetch completed successfully!</p>
                      <ul className="text-sm space-y-1">
                        <li>Candidates found: {resultDaily.candidatesFound}</li>
                        <li>Entries added: {resultDaily.entriesAdded}</li>
                        <li>Duplicates skipped: {resultDaily.duplicatesSkipped}</li>
                        <li>
                          Duration: {(resultDaily.duration / 1000).toFixed(2)}s
                        </li>
                      </ul>
                      {resultDaily.errors && resultDaily.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-destructive">
                            Errors: {resultDaily.errors.length}
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Weekly Digest */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Digest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a weekly digest summarizing research from the past 7
                days. Normally runs automatically every Sunday at 8 PM.
              </p>

              <Button
                onClick={triggerWeeklyDigest}
                disabled={loadingWeekly}
                className="w-full"
                variant="secondary"
              >
                {loadingWeekly ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Generate Weekly Digest
                  </>
                )}
              </Button>

              {resultWeekly && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        Weekly digest generated successfully!
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>
                          Entries processed: {resultWeekly.entriesProcessed}
                        </li>
                        <li>
                          Period: {resultWeekly.periodStart} to{" "}
                          {resultWeekly.periodEnd}
                        </li>
                        <li>
                          Duration: {(resultWeekly.duration / 1000).toFixed(2)}s
                        </li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Monthly Digest */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Digest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a monthly digest with comprehensive statistics and
                analysis. Normally runs automatically on the 1st of each month.
              </p>

              <Button
                onClick={triggerMonthlyDigest}
                disabled={loadingMonthly}
                className="w-full"
                variant="secondary"
              >
                {loadingMonthly ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Generate Monthly Digest
                  </>
                )}
              </Button>

              {resultMonthly && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        Monthly digest generated successfully!
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>
                          Entries processed: {resultMonthly.entriesProcessed}
                        </li>
                        <li>
                          Period: {resultMonthly.periodStart} to{" "}
                          {resultMonthly.periodEnd}
                        </li>
                        <li>
                          Duration: {(resultMonthly.duration / 1000).toFixed(2)}s
                        </li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Data Sources</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PubMed/NCBI E-utilities</li>
                  <li>• AI: Anthropic Claude API</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Automated Jobs (Vercel Cron)
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Weekly digest: Every Sunday at 8 PM</li>
                  <li>• Monthly digest: 1st of each month at midnight</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Daily fetch not yet automated
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Configuration</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Database:{" "}
                    {process.env.NEXT_PUBLIC_DB_CONFIGURED ? "✓" : "✗"}
                  </li>
                  <li>
                    • Claude API:{" "}
                    {process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED ? "✓" : "✗"}
                  </li>
                  <li>
                    • PubMed API:{" "}
                    {process.env.NEXT_PUBLIC_NCBI_CONFIGURED ? "✓" : "✗"}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="mt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
