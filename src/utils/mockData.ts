import type {
  Hall,
  Exhibit,
  HallConnection,
  TourPlan,
  TimeSlot,
  HallCapacity,
  GuideResource,
  AlternativeRoute,
  CongestionAlert,
  DispatchRecord,
  ResourceOccupancySnapshot,
  AutoDispatchConfig,
} from '@/types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const initialTimeSlots: TimeSlot[] = [
  { id: 'ts1', startTime: '09:00', endTime: '10:00', expectedVisitors: 150, actualVisitors: 142, status: 'completed' },
  { id: 'ts2', startTime: '10:00', endTime: '11:00', expectedVisitors: 200, actualVisitors: 198, status: 'completed' },
  { id: 'ts3', startTime: '11:00', endTime: '12:00', expectedVisitors: 250, actualVisitors: 245, status: 'ongoing' },
  { id: 'ts4', startTime: '13:00', endTime: '14:00', expectedVisitors: 200, actualVisitors: 0, status: 'scheduled' },
  { id: 'ts5', startTime: '14:00', endTime: '15:00', expectedVisitors: 250, actualVisitors: 0, status: 'scheduled' },
  { id: 'ts6', startTime: '15:00', endTime: '16:00', expectedVisitors: 200, actualVisitors: 0, status: 'scheduled' },
  { id: 'ts7', startTime: '16:00', endTime: '17:00', expectedVisitors: 150, actualVisitors: 0, status: 'scheduled' },
];

export const initialHallCapacities: HallCapacity[] = [
  { hallId: 'h1', maxCapacity: 80, currentVisitors: 45, warningThreshold: 60, criticalThreshold: 75, status: 'normal' },
  { hallId: 'h2', maxCapacity: 60, currentVisitors: 52, warningThreshold: 45, criticalThreshold: 55, status: 'warning' },
  { hallId: 'h3', maxCapacity: 50, currentVisitors: 48, warningThreshold: 38, criticalThreshold: 45, status: 'critical' },
  { hallId: 'h4', maxCapacity: 70, currentVisitors: 30, warningThreshold: 53, criticalThreshold: 65, status: 'normal' },
  { hallId: 'h5', maxCapacity: 100, currentVisitors: 60, warningThreshold: 75, criticalThreshold: 90, status: 'normal' },
];

export const initialGuideResources: GuideResource[] = [
  { id: 'gr1', name: '张讲解员', type: 'guide', status: 'assigned', assignedPlanId: 'p2', assignedTimeSlotId: 'ts3', contact: '13800000001' },
  { id: 'gr2', name: '李讲解员', type: 'guide', status: 'available', assignedPlanId: null, assignedTimeSlotId: null, contact: '13800000002' },
  { id: 'gr3', name: '王志愿者', type: 'volunteer', status: 'busy', assignedPlanId: 'p1', assignedTimeSlotId: 'ts3', contact: '13800000003' },
  { id: 'gr4', name: '赵志愿者', type: 'volunteer', status: 'available', assignedPlanId: null, assignedTimeSlotId: null },
  { id: 'gr5', name: '语音设备-A01', type: 'audio_device', status: 'assigned', assignedPlanId: 'p3', assignedTimeSlotId: 'ts3' },
  { id: 'gr6', name: '语音设备-A02', type: 'audio_device', status: 'available', assignedPlanId: null, assignedTimeSlotId: null },
  { id: 'gr7', name: '语音设备-A03', type: 'audio_device', status: 'available', assignedPlanId: null, assignedTimeSlotId: null },
  { id: 'gr8', name: '陈讲解员', type: 'guide', status: 'rest', assignedPlanId: null, assignedTimeSlotId: null, contact: '13800000004' },
];

export const initialAlternativeRoutes: AlternativeRoute[] = [
  {
    id: 'ar1',
    name: '儿童避峰路线',
    audienceType: 'children',
    originalPlanId: 'p1',
    stopIds: [],
    reason: '书画艺术厅高峰期拥挤，建议先参观民俗文化馆',
    peakHours: ['10:00-12:00', '14:00-16:00'],
    createdAt: Date.now() - 3600000,
  },
];

export const initialCongestionAlerts: CongestionAlert[] = [
  {
    id: 'ca1',
    hallId: 'h3',
    level: 'critical',
    message: '瓷器展厅当前人数接近最大容纳量，存在严重拥堵风险',
    timestamp: Date.now() - 600000,
    resolved: false,
    suggestions: ['引导观众先参观其他展厅', '增加该区域志愿者', '启动替代导览路线'],
    processingStatus: 'resources_dispatched',
    recommendedRouteId: 'ar1',
    dispatchRecordIds: ['dr1', 'dr2'],
    processedAt: Date.now() - 500000,
    handledBy: 'system',
  },
  {
    id: 'ca2',
    hallId: 'h2',
    level: 'warning',
    message: '书画艺术厅人流量较高，请关注后续变化',
    timestamp: Date.now() - 1200000,
    resolved: false,
    suggestions: ['准备分流预案', '提醒讲解员控制参观节奏'],
    processingStatus: 'route_recommended',
    recommendedRouteId: null,
    dispatchRecordIds: ['dr3'],
    processedAt: Date.now() - 1000000,
    handledBy: 'system',
  },
];

export const initialDispatchRecords: DispatchRecord[] = [
  {
    id: 'dr1',
    alertId: 'ca1',
    hallId: 'h3',
    actionType: 'auto_assign_volunteer',
    resourceId: 'gr4',
    resourceType: 'volunteer',
    routeId: null,
    timeSlotId: 'ts3',
    description: '瓷器展厅拥堵，自动分配赵志愿者前往支援',
    timestamp: Date.now() - 550000,
    operator: 'system',
    result: 'success',
  },
  {
    id: 'dr2',
    alertId: 'ca1',
    hallId: 'h3',
    actionType: 'auto_assign_audio',
    resourceId: 'gr6',
    resourceType: 'audio_device',
    routeId: null,
    timeSlotId: 'ts3',
    description: '瓷器展厅拥堵，分配语音设备-A02供自助导览使用',
    timestamp: Date.now() - 520000,
    operator: 'system',
    result: 'success',
  },
  {
    id: 'dr3',
    alertId: 'ca2',
    hallId: 'h2',
    actionType: 'recommend_route',
    resourceId: null,
    resourceType: null,
    routeId: 'ar1',
    timeSlotId: null,
    description: '书画艺术厅预警，推荐启用儿童避峰路线',
    timestamp: Date.now() - 1100000,
    operator: 'system',
    result: 'success',
  },
];

export const initialResourceSnapshots: ResourceOccupancySnapshot[] = [
  {
    id: 'snap1',
    timestamp: Date.now() - 3600000,
    resourceType: 'guide',
    totalCount: 3,
    availableCount: 2,
    assignedCount: 1,
    busyCount: 0,
    restCount: 0,
    occupancyRate: 33,
  },
  {
    id: 'snap2',
    timestamp: Date.now() - 1800000,
    resourceType: 'guide',
    totalCount: 3,
    availableCount: 1,
    assignedCount: 1,
    busyCount: 1,
    restCount: 0,
    occupancyRate: 67,
  },
  {
    id: 'snap3',
    timestamp: Date.now(),
    resourceType: 'guide',
    totalCount: 3,
    availableCount: 1,
    assignedCount: 1,
    busyCount: 0,
    restCount: 1,
    occupancyRate: 33,
  },
];

export const initialAutoDispatchConfig: AutoDispatchConfig = {
  enabled: true,
  autoTriggerWarning: true,
  autoTriggerCritical: true,
  autoRecommendRoute: true,
  autoAssignGuide: true,
  autoAssignVolunteer: true,
  autoAssignAudioDevice: true,
  guideDispatchThreshold: 70,
  volunteerDispatchThreshold: 60,
  audioDeviceDispatchThreshold: 50,
};

export const initialHalls: Hall[] = [
  { id: 'h1', name: '古代文明厅', x: 80, y: 60, width: 220, height: 140 },
  { id: 'h2', name: '书画艺术厅', x: 400, y: 40, width: 220, height: 140 },
  { id: 'h3', name: '瓷器展厅', x: 720, y: 60, width: 220, height: 140 },
  { id: 'h4', name: '民俗文化馆', x: 160, y: 300, width: 220, height: 140 },
  { id: 'h5', name: '临时展厅', x: 520, y: 300, width: 220, height: 140 },
];

export const initialExhibits: Exhibit[] = [
  { id: 'e1', hallId: 'h1', name: '青铜鼎', description: '商代晚期青铜礼器，通高133厘米', audioUrl: '', defaultDuration: 180 },
  { id: 'e2', hallId: 'h1', name: '玉琮', description: '良渚文化典型玉器，外方内圆', audioUrl: '', defaultDuration: 150 },
  { id: 'e3', hallId: 'h1', name: '甲骨文片', description: '商代占卜用龟甲，刻有早期文字', audioUrl: '', defaultDuration: 200 },
  { id: 'e4', hallId: 'h2', name: '清明上河图', description: '北宋张择端绘，描绘汴京繁华', audioUrl: '', defaultDuration: 240 },
  { id: 'e5', hallId: 'h2', name: '兰亭序摹本', description: '唐代冯承素摹王羲之兰亭序', audioUrl: '', defaultDuration: 180 },
  { id: 'e6', hallId: 'h3', name: '青花瓷瓶', description: '元代青花缠枝牡丹纹梅瓶', audioUrl: '', defaultDuration: 160 },
  { id: 'e7', hallId: 'h3', name: '汝窑天青釉洗', description: '北宋汝窑精品，天青色釉面', audioUrl: '', defaultDuration: 170 },
  { id: 'e8', hallId: 'h4', name: '皮影戏套组', description: '陕西华县皮影，含人物场景数十件', audioUrl: '', defaultDuration: 200 },
  { id: 'e9', hallId: 'h4', name: '年画雕版', description: '天津杨柳青年画原版', audioUrl: '', defaultDuration: 140 },
  { id: 'e10', hallId: 'h5', name: '丝路遗珍', description: '唐代丝绸之路出土文物特展', audioUrl: '', defaultDuration: 220 },
  { id: 'e11', hallId: 'h5', name: '数字互动装置', description: '沉浸式数字艺术体验区', audioUrl: '', defaultDuration: 300 },
];

export const initialConnections: HallConnection[] = [
  { id: 'c1', fromHallId: 'h1', toHallId: 'h2', priority: 1 },
  { id: 'c2', fromHallId: 'h2', toHallId: 'h3', priority: 1 },
  { id: 'c3', fromHallId: 'h1', toHallId: 'h4', priority: 2 },
  { id: 'c4', fromHallId: 'h4', toHallId: 'h5', priority: 1 },
  { id: 'c5', fromHallId: 'h2', toHallId: 'h5', priority: 2 },
  { id: 'c6', fromHallId: 'h3', toHallId: 'h5', priority: 3 },
];

export const initialPlans: TourPlan[] = [
  {
    id: 'p1',
    name: '亲子趣味探索',
    audienceType: 'children',
    stops: [
      { id: uid(), exhibitId: 'e1', order: 1, duration: 120 },
      { id: uid(), exhibitId: 'e8', order: 2, duration: 180 },
      { id: uid(), exhibitId: 'e10', order: 3, duration: 200 },
      { id: uid(), exhibitId: 'e11', order: 4, duration: 240 },
    ],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'p2',
    name: '经典通识导览',
    audienceType: 'general',
    stops: [
      { id: uid(), exhibitId: 'e1', order: 1, duration: 180 },
      { id: uid(), exhibitId: 'e2', order: 2, duration: 150 },
      { id: uid(), exhibitId: 'e4', order: 3, duration: 240 },
      { id: uid(), exhibitId: 'e5', order: 4, duration: 180 },
      { id: uid(), exhibitId: 'e6', order: 5, duration: 160 },
      { id: uid(), exhibitId: 'e9', order: 6, duration: 140 },
    ],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now(),
  },
  {
    id: 'p3',
    name: '学术深度研究',
    audienceType: 'research',
    stops: [
      { id: uid(), exhibitId: 'e1', order: 1, duration: 300 },
      { id: uid(), exhibitId: 'e3', order: 2, duration: 280 },
      { id: uid(), exhibitId: 'e4', order: 3, duration: 360 },
      { id: uid(), exhibitId: 'e5', order: 4, duration: 300 },
      { id: uid(), exhibitId: 'e7', order: 5, duration: 260 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
