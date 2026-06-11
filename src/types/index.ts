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

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  expectedVisitors: number;
  actualVisitors: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'full';
}

export interface HallCapacity {
  hallId: string;
  maxCapacity: number;
  currentVisitors: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: 'normal' | 'warning' | 'critical';
}

export type ResourceType = 'guide' | 'audio_device' | 'volunteer';

export interface GuideResource {
  id: string;
  name: string;
  type: ResourceType;
  status: 'available' | 'assigned' | 'busy' | 'rest';
  assignedPlanId: string | null;
  assignedTimeSlotId: string | null;
  contact?: string;
}

export interface AlternativeRoute {
  id: string;
  name: string;
  audienceType: AudienceType;
  originalPlanId: string;
  stopIds: string[];
  reason: string;
  peakHours: string[];
  createdAt: number;
}

export interface CongestionAlert {
  id: string;
  hallId: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  suggestions: string[];
}

export interface DispatchExportData {
  exportedAt: number;
  date: string;
  timeSlots: TimeSlot[];
  hallCapacities: Array<HallCapacity & { hallName: string }>;
  resources: GuideResource[];
  alternativeRoutes: AlternativeRoute[];
  alerts: CongestionAlert[];
  summary: {
    totalExpectedVisitors: number;
    totalActualVisitors: number;
    normalHalls: number;
    warningHalls: number;
    criticalHalls: number;
    availableResources: number;
    activeAlerts: number;
  };
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  guide: '讲解员',
  audio_device: '语音设备',
  volunteer: '志愿者',
};

export const RESOURCE_STATUS_LABELS: Record<GuideResource['status'], string> = {
  available: '空闲',
  assigned: '已分配',
  busy: '服务中',
  rest: '休息',
};

export const RESOURCE_STATUS_COLORS: Record<GuideResource['status'], string> = {
  available: '#10B981',
  assigned: '#3B82F6',
  busy: '#F59E0B',
  rest: '#9CA3AF',
};

export const SLOT_STATUS_LABELS: Record<TimeSlot['status'], string> = {
  scheduled: '未开始',
  ongoing: '进行中',
  completed: '已结束',
  full: '已满员',
};

export const CAPACITY_STATUS_LABELS: Record<HallCapacity['status'], string> = {
  normal: '正常',
  warning: '预警',
  critical: '拥挤',
};

export const CAPACITY_STATUS_COLORS: Record<HallCapacity['status'], string> = {
  normal: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
};
