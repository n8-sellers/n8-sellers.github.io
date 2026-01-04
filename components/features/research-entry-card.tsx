"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { Sparkles, TrendingUp, FlaskConical, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchEntry } from "@/lib/db/schema";

interface ResearchEntryCardProps {
  entry: ResearchEntry;
  onClick?: () => void;
}

const impactLevelConfig = {
  breakthrough: {
    label: "Breakthrough",
    color: "bg-amber-100 text-amber-900 border-amber-300",
    icon: Sparkles,
    cardClass: "border-amber-400 bg-amber-50/50 shadow-lg animate-glow-pulse",
  },
  significant: {
    label: "Significant",
    color: "bg-blue-100 text-blue-900 border-blue-300",
    icon: TrendingUp,
    cardClass: "border-blue-400 bg-blue-50/30",
  },
  incremental: {
    label: "Incremental",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: FlaskConical,
    cardClass: "border-gray-300",
  },
  early_stage: {
    label: "Early Stage",
    color: "bg-purple-100 text-purple-900 border-purple-300",
    icon: Eye,
    cardClass: "border-dashed border-purple-400",
  },
};

const treatmentCategoryLabels: Record<string, string> = {
  immunotherapy: "Immunotherapy",
  targeted_therapy: "Targeted Therapy",
  gene_therapy: "Gene Therapy",
  screening_detection: "Screening & Detection",
  prevention: "Prevention",
  surgical: "Surgical",
  radiation: "Radiation",
  combination: "Combination",
  supportive_care: "Supportive Care",
  other: "Other",
};

const researchPhaseLabels: Record<string, string> = {
  preclinical: "Preclinical",
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  phase_3: "Phase 3",
  fda_review: "FDA Review",
  approved: "Approved",
  basic_research: "Basic Research",
};

export function ResearchEntryCard({ entry, onClick }: ResearchEntryCardProps) {
  const config = impactLevelConfig[entry.impactLevel];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        config.cardClass
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={cn("font-semibold", config.color)}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <Badge variant="outline">
                {treatmentCategoryLabels[entry.treatmentCategory]}
              </Badge>
              <Badge variant="outline">
                {researchPhaseLabels[entry.researchPhase]}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
            {entry.cancerTypes.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap text-sm text-muted-foreground">
                {entry.cancerTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-secondary rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {entry.plainLanguageSummary || entry.summary}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {entry.sourceName && <span>{entry.sourceName}</span>}
            {entry.publishedAt && (
              <span>{formatRelativeTime(entry.publishedAt)}</span>
            )}
          </div>
          {entry.timeToImpact && (
            <span className="font-medium text-primary">
              Impact: {entry.timeToImpact}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
