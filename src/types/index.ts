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

export type AlertProcessingStatus = 'pending' | 'auto_processing' | 'route_recommended' | 'resources_dispatched' | 'manually_handled' | 'resolved';

export interface CongestionAlert {
  id: string;
  hallId: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  suggestions: string[];
  processingStatus: AlertProcessingStatus;
  recommendedRouteId: string | null;
  dispatchRecordIds: string[];
  processedAt: number | null;
  handledBy: string | null;
}

export type DispatchActionType = 'auto_assign_guide' | 'auto_assign_volunteer' | 'auto_assign_audio' | 'recommend_route' | 'manual_adjust' | 'auto_trigger';

export interface DispatchRecord {
  id: string;
  alertId: string | null;
  hallId: string | null;
  actionType: DispatchActionType;
  resourceId: string | null;
  resourceType: ResourceType | null;
  routeId: string | null;
  timeSlotId: string | null;
  description: string;
  timestamp: number;
  operator: 'system' | 'manual';
  result: 'success' | 'failed' | 'pending';
  detail?: string;
}

export interface ResourceOccupancySnapshot {
  id: string;
  timestamp: number;
  resourceType: ResourceType;
  totalCount: number;
  availableCount: number;
  assignedCount: number;
  busyCount: number;
  restCount: number;
  occupancyRate: number;
}

export interface AutoDispatchConfig {
  enabled: boolean;
  autoTriggerWarning: boolean;
  autoTriggerCritical: boolean;
  autoRecommendRoute: boolean;
  autoAssignGuide: boolean;
  autoAssignVolunteer: boolean;
  autoAssignAudioDevice: boolean;
  guideDispatchThreshold: number;
  volunteerDispatchThreshold: number;
  audioDeviceDispatchThreshold: number;
}

export interface DispatchExportData {
  exportedAt: number;
  date: string;
  timeSlots: TimeSlot[];
  hallCapacities: Array<HallCapacity & { hallName: string }>;
  resources: GuideResource[];
  alternativeRoutes: AlternativeRoute[];
  alerts: CongestionAlert[];
  dispatchRecords: DispatchRecord[];
  resourceSnapshots: ResourceOccupancySnapshot[];
  autoDispatchConfig: AutoDispatchConfig;
  summary: {
    totalExpectedVisitors: number;
    totalActualVisitors: number;
    normalHalls: number;
    warningHalls: number;
    criticalHalls: number;
    availableResources: number;
    activeAlerts: number;
    pendingAlerts: number;
    autoProcessedAlerts: number;
    resolvedAlerts: number;
    totalDispatches: number;
    autoDispatches: number;
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

export const ALERT_PROCESSING_STATUS_LABELS: Record<AlertProcessingStatus, string> = {
  pending: '待处理',
  auto_processing: '自动处理中',
  route_recommended: '路线已推荐',
  resources_dispatched: '资源已调度',
  manually_handled: '人工处理',
  resolved: '已解决',
};

export const ALERT_PROCESSING_STATUS_COLORS: Record<AlertProcessingStatus, string> = {
  pending: '#9CA3AF',
  auto_processing: '#3B82F6',
  route_recommended: '#8B5CF6',
  resources_dispatched: '#14B8A6',
  manually_handled: '#F59E0B',
  resolved: '#10B981',
};

export const DISPATCH_ACTION_LABELS: Record<DispatchActionType, string> = {
  auto_assign_guide: '自动分配讲解员',
  auto_assign_volunteer: '自动分配志愿者',
  auto_assign_audio: '自动分配语音设备',
  recommend_route: '推荐替代路线',
  manual_adjust: '人工调整',
  auto_trigger: '自动触发预警',
};
