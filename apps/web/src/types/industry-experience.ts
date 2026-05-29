export type IndustryReadinessTone = "ready" | "guided" | "custom";
export type IndustryKpiTrend = "up" | "flat" | "watch";
export type IndustryComplianceTone = "ready" | "review" | "optional";
export type IndustryChecklistStatus = "included" | "recommended" | "optional";

export interface IndustryHeroStat {
  label: string;
  value: string;
  detail: string;
}

export interface IndustryCapabilityModule {
  id: string;
  title: string;
  description: string;
  channels: string[];
  highlights: string[];
}

export interface IndustryKpiSnapshot {
  label: string;
  value: string;
  detail: string;
  trend: IndustryKpiTrend;
}

export interface IndustryComplianceBadge {
  label: string;
  tone: IndustryComplianceTone;
  note: string;
}

export interface IndustryLaunchChecklistItem {
  label: string;
  description: string;
  status: IndustryChecklistStatus;
}

export interface IndustryWorkflowReadiness {
  label: string;
  note: string;
  tone: IndustryReadinessTone;
}

export interface IndustryWorkflowSummary {
  headline: string;
  description: string;
  automationMoments: string[];
}

export interface IndustryBlueprint {
  industryId: string;
  heroOutcome: string;
  heroDetail: string;
  activeChannels: string[];
  heroStats: IndustryHeroStat[];
  workflowReadiness: IndustryWorkflowReadiness;
  capabilityModules: IndustryCapabilityModule[];
  kpiSnapshot: IndustryKpiSnapshot[];
  complianceBadges: IndustryComplianceBadge[];
  launchChecklist: IndustryLaunchChecklistItem[];
  integrationsFocus: string[];
  workflowSummary: IndustryWorkflowSummary;
}
