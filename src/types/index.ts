export interface Hall {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Exhibit {
  id: string;
  hallId: string;
  name: string;
  description: string;
  audioUrl: string;
  defaultDuration: number;
}

export interface HallConnection {
  id: string;
  fromHallId: string;
  toHallId: string;
  priority: number;
}

export type AudienceType = 'children' | 'general' | 'research';

export type PlayOrderMode = 'edit' | 'recommended';

export interface TourStop {
  id: string;
  exhibitId: string;
  order: number;
  duration: number;
}

export interface TourPlan {
  id: string;
  name: string;
  audienceType: AudienceType;
  stops: TourStop[];
  createdAt: number;
  updatedAt: number;
}

export interface RouteConfig {
  halls: Hall[];
  exhibits: Exhibit[];
  connections: HallConnection[];
  plans: TourPlan[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StatsInfo {
  totalDuration: number;
  duplicateExhibits: string[];
  jumpPoints: string[];
  repeatedPaths: string[];
}

export interface DuplicateDetail {
  exhibitId: string;
  exhibitName: string;
  indices: number[];
}

export interface DisconnectionDetail {
  fromStopIndex: number;
  toStopIndex: number;
  fromExhibitName: string;
  toExhibitName: string;
  fromHallName: string;
  toHallName: string;
  reason: string;
}

export interface JumpDetail {
  fromStopIndex: number;
  toStopIndex: number;
  fromExhibitName: string;
  toExhibitName: string;
  fromHallName: string;
  toHallName: string;
}

export interface RepeatedPathDetail {
  fromHallName: string;
  toHallName: string;
  count: number;
  occurrences: Array<{ fromIndex: number; toIndex: number }>;
}

export interface ValidationCenterReport {
  totalDuration: number;
  totalStops: number;
  duplicateExhibits: DuplicateDetail[];
  disconnections: DisconnectionDetail[];
  jumps: JumpDetail[];
  repeatedPaths: RepeatedPathDetail[];
  hasCriticalIssues: boolean;
  hasWarnings: boolean;
}

export interface ImportPreviewData {
  config: RouteConfig;
  rawJson: string;
  validation: ValidationResult;
  planValidationReports: Array<{
    planName: string;
    report: ValidationCenterReport;
  }>;
  summary: {
    hallsCount: number;
    exhibitsCount: number;
    connectionsCount: number;
    plansCount: number;
    totalStops: number;
  };
}

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  children: '儿童',
  general: '通识',
  research: '深度研究',
};

export const AUDIENCE_COLORS: Record<AudienceType, string> = {
  children: '#F59E0B',
  general: '#14B8A6',
  research: '#8B5CF6',
};
