"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSidebarProps {
  filters: {
    impactLevel?: string;
    cancerType?: string;
    treatmentCategory?: string;
    researchPhase?: string;
  };
  onFilterChange: (filters: any) => void;
}

const impactLevels: FilterOption[] = [
  { value: "breakthrough", label: "Breakthrough" },
  { value: "significant", label: "Significant" },
  { value: "incremental", label: "Incremental" },
  { value: "early_stage", label: "Early Stage" },
];

const commonCancerTypes: FilterOption[] = [
  { value: "breast", label: "Breast" },
  { value: "lung", label: "Lung" },
  { value: "colorectal", label: "Colorectal" },
  { value: "prostate", label: "Prostate" },
  { value: "pancreatic", label: "Pancreatic" },
  { value: "leukemia", label: "Leukemia" },
  { value: "lymphoma", label: "Lymphoma" },
  { value: "melanoma", label: "Melanoma" },
];

const treatmentCategories: FilterOption[] = [
  { value: "immunotherapy", label: "Immunotherapy" },
  { value: "targeted_therapy", label: "Targeted Therapy" },
  { value: "gene_therapy", label: "Gene Therapy" },
  { value: "screening_detection", label: "Screening & Detection" },
  { value: "prevention", label: "Prevention" },
  { value: "combination", label: "Combination" },
];

const researchPhases: FilterOption[] = [
  { value: "approved", label: "Approved" },
  { value: "fda_review", label: "FDA Review" },
  { value: "phase_3", label: "Phase 3" },
  { value: "phase_2", label: "Phase 2" },
  { value: "phase_1", label: "Phase 1" },
  { value: "preclinical", label: "Preclinical" },
];

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v);

  const clearFilters = () => {
    onFilterChange({});
  };

  const toggleFilter = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: filters[key as keyof typeof filters] === value ? undefined : value,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Impact Level */}
          <div>
            <h3 className="font-medium text-sm mb-2">Impact Level</h3>
            <div className="flex flex-wrap gap-2">
              {impactLevels.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    filters.impactLevel === option.value
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleFilter("impactLevel", option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cancer Type */}
          <div>
            <h3 className="font-medium text-sm mb-2">Cancer Type</h3>
            <div className="flex flex-wrap gap-2">
              {commonCancerTypes.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    filters.cancerType === option.value ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleFilter("cancerType", option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Treatment Category */}
          <div>
            <h3 className="font-medium text-sm mb-2">Treatment Category</h3>
            <div className="flex flex-wrap gap-2">
              {treatmentCategories.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    filters.treatmentCategory === option.value
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleFilter("treatmentCategory", option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Research Phase */}
          <div>
            <h3 className="font-medium text-sm mb-2">Research Phase</h3>
            <div className="flex flex-wrap gap-2">
              {researchPhases.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    filters.researchPhase === option.value
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleFilter("researchPhase", option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
