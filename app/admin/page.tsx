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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check - real auth happens on API calls
    setAuthenticated(true);
  };

  const triggerDailyFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          {/* Manual Job Trigger */}
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
                disabled={loading}
                className="w-full"
              >
                {loading ? (
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

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Fetch completed successfully!</p>
                      <ul className="text-sm space-y-1">
                        <li>Candidates found: {result.candidatesFound}</li>
                        <li>Entries added: {result.entriesAdded}</li>
                        <li>Duplicates skipped: {result.duplicatesSkipped}</li>
                        <li>
                          Duration: {(result.duration / 1000).toFixed(2)}s
                        </li>
                      </ul>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-destructive">
                            Errors: {result.errors.length}
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Information */}
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
                  Automated Jobs (Future)
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Daily fetch: Not yet configured</li>
                  <li>• Weekly digest: Not yet configured</li>
                  <li>• Monthly recap: Not yet configured</li>
                </ul>
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
      </div>
    </div>
  );
}
