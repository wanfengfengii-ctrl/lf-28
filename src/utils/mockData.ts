import type { Hall, Exhibit, HallConnection, TourPlan } from '@/types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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
