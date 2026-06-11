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
