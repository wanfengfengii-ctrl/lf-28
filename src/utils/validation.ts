import type { TourPlan, HallConnection, Exhibit, Hall, ValidationResult, StatsInfo } from '@/types';

export function validateStopUniqueness(plan: TourPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const exhibitIds = plan.stops.map((s) => s.exhibitId);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of exhibitIds) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }

  if (duplicates.length > 0) {
    errors.push(`展品讲解顺序存在重复：${duplicates.join('、')}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateDuration(plan: TourPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const stop of plan.stops) {
    if (stop.duration <= 0) {
      errors.push(`"${stop.exhibitId}" 停留时长必须大于零`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateRouteConnectivity(
  plan: TourPlan,
  exhibits: Exhibit[],
  connections: HallConnection[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (plan.stops.length < 2) return { valid: true, errors, warnings };

  const connectedPairs = new Set<string>();
  for (const conn of connections) {
    connectedPairs.add(`${conn.fromHallId}->${conn.toHallId}`);
    connectedPairs.add(`${conn.toHallId}->${conn.fromHallId}`);
  }

  for (let i = 0; i < plan.stops.length - 1; i++) {
    const currentExhibit = exhibits.find((e) => e.id === plan.stops[i].exhibitId);
    const nextExhibit = exhibits.find((e) => e.id === plan.stops[i + 1].exhibitId);
    if (!currentExhibit || !nextExhibit) continue;

    if (currentExhibit.hallId !== nextExhibit.hallId) {
      const key = `${currentExhibit.hallId}->${nextExhibit.hallId}`;
      if (!connectedPairs.has(key)) {
        errors.push(
          `从"${currentExhibit.name}"到"${nextExhibit.name}"的展厅之间没有连接`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function computeStats(
  plan: TourPlan,
  exhibits: Exhibit[],
  halls: Hall[],
  connections: HallConnection[]
): StatsInfo {
  const totalDuration = plan.stops.reduce((sum, s) => sum + s.duration, 0);

  const exhibitCount = new Map<string, number>();
  for (const stop of plan.stops) {
    exhibitCount.set(stop.exhibitId, (exhibitCount.get(stop.exhibitId) || 0) + 1);
  }
  const duplicateExhibits = Array.from(exhibitCount.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => {
      const ex = exhibits.find((e) => e.id === id);
      return ex ? ex.name : id;
    });

  const jumpPoints: string[] = [];
  for (let i = 0; i < plan.stops.length - 1; i++) {
    const curr = exhibits.find((e) => e.id === plan.stops[i].exhibitId);
    const next = exhibits.find((e) => e.id === plan.stops[i + 1].exhibitId);
    if (curr && next && curr.hallId !== next.hallId) {
      const connected = connections.some(
        (c) =>
          (c.fromHallId === curr.hallId && c.toHallId === next.hallId) ||
          (c.fromHallId === next.hallId && c.toHallId === curr.hallId)
      );
      if (!connected) {
        const fromHall = halls.find((h) => h.id === curr.hallId);
        const toHall = halls.find((h) => h.id === next.hallId);
        jumpPoints.push(
          `${fromHall?.name || curr.hallId} → ${toHall?.name || next.hallId}`
        );
      }
    }
  }

  const hallSequence = plan.stops.map((s) => {
    const ex = exhibits.find((e) => e.id === s.exhibitId);
    return ex?.hallId || '';
  });

  const pathCount = new Map<string, number>();
  for (let i = 0; i < hallSequence.length - 1; i++) {
    if (hallSequence[i] !== hallSequence[i + 1]) {
      const key = [hallSequence[i], hallSequence[i + 1]].sort().join('<->');
      pathCount.set(key, (pathCount.get(key) || 0) + 1);
    }
  }
  const repeatedPaths = Array.from(pathCount.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => {
      const [a, b] = key.split('<->');
      const ha = halls.find((h) => h.id === a);
      const hb = halls.find((h) => h.id === b);
      return `${ha?.name || a} ↔ ${hb?.name || b} (×${count})`;
    });

  return { totalDuration, duplicateExhibits, jumpPoints, repeatedPaths };
}

export function isExhibitReferencedByPlans(
  exhibitId: string,
  plans: TourPlan[]
): TourPlan[] {
  return plans.filter((p) => p.stops.some((s) => s.exhibitId === exhibitId));
}

export function validateImportConfig(config: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('配置格式无效');
    return { valid: false, errors, warnings };
  }

  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.halls)) errors.push('缺少展厅数据');
  if (!Array.isArray(c.exhibits)) errors.push('缺少展品数据');
  if (!Array.isArray(c.connections)) errors.push('缺少连接数据');
  if (!Array.isArray(c.plans)) errors.push('缺少方案数据');

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const halls = c.halls as Hall[];
  const exhibits = c.exhibits as Exhibit[];
  const connections = c.connections as HallConnection[];
  const plans = c.plans as TourPlan[];

  const hallIds = new Set(halls.map((h) => h.id));
  const exhibitIds = new Set(exhibits.map((e) => e.id));

  for (const exhibit of exhibits) {
    if (!hallIds.has(exhibit.hallId)) {
      errors.push(`展品"${exhibit.name}"引用了不存在的展厅: ${exhibit.hallId}`);
    }
    if (exhibit.defaultDuration <= 0) {
      errors.push(`展品"${exhibit.name}"的默认时长必须大于零`);
    }
  }

  for (const conn of connections) {
    if (!hallIds.has(conn.fromHallId)) {
      errors.push(`连接引用了不存在的起始展厅: ${conn.fromHallId}`);
    }
    if (!hallIds.has(conn.toHallId)) {
      errors.push(`连接引用了不存在的目标展厅: ${conn.toHallId}`);
    }
  }

  for (const plan of plans) {
    if (!plan.id) errors.push('方案缺少ID');
    if (!plan.name) warnings.push('方案缺少名称');
    if (!Array.isArray(plan.stops)) {
      errors.push(`方案"${plan.name || plan.id}"缺少停靠点列表`);
      continue;
    }

    const seenExhibitIds = new Set<string>();
    for (const stop of plan.stops) {
      if (!exhibitIds.has(stop.exhibitId)) {
        errors.push(`方案"${plan.name || plan.id}"引用了不存在的展品: ${stop.exhibitId}`);
      }
      if (stop.duration <= 0) {
        errors.push(`方案"${plan.name || plan.id}"中存在停留时长为零的停靠点`);
      }
      if (seenExhibitIds.has(stop.exhibitId)) {
        const ex = exhibits.find((e) => e.id === stop.exhibitId);
        errors.push(`方案"${plan.name || plan.id}"中展品"${ex?.name || stop.exhibitId}"重复出现`);
      }
      seenExhibitIds.add(stop.exhibitId);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
