import type {
  TourPlan,
  HallConnection,
  Exhibit,
  Hall,
  ValidationResult,
  StatsInfo,
  TourStop,
  ValidationCenterReport,
  DuplicateDetail,
  DisconnectionDetail,
  JumpDetail,
  RepeatedPathDetail,
  RouteConfig,
  ImportPreviewData,
} from '@/types';

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

function getConnectionPriority(
  fromHallId: string,
  toHallId: string,
  connections: HallConnection[]
): number {
  const conn = connections.find(
    (c) =>
      (c.fromHallId === fromHallId && c.toHallId === toHallId) ||
      (c.fromHallId === toHallId && c.toHallId === fromHallId)
  );
  return conn ? conn.priority : -1;
}

function hallsAreConnected(
  fromHallId: string,
  toHallId: string,
  connections: HallConnection[]
): boolean {
  if (fromHallId === toHallId) return true;
  return connections.some(
    (c) =>
      (c.fromHallId === fromHallId && c.toHallId === toHallId) ||
      (c.fromHallId === toHallId && c.toHallId === fromHallId)
  );
}

export function generateRecommendedRoute(
  stops: TourStop[],
  exhibits: Exhibit[],
  connections: HallConnection[]
): TourStop[] {
  if (stops.length <= 2) return [...stops];

  const stopExhibitMap = new Map(stops.map((s) => [s.id, exhibits.find((e) => e.id === s.exhibitId)]));
  const stopHallMap = new Map(
    stops.map((s) => {
      const ex = stopExhibitMap.get(s.id);
      return [s.id, ex?.hallId || ''];
    })
  );

  const hallGroupedStops = new Map<string, TourStop[]>();
  for (const stop of stops) {
    const hallId = stopHallMap.get(stop.id) || '';
    if (!hallGroupedStops.has(hallId)) {
      hallGroupedStops.set(hallId, []);
    }
    hallGroupedStops.get(hallId)!.push(stop);
  }

  const hallIds = Array.from(hallGroupedStops.keys());
  if (hallIds.length <= 1) return [...stops];

  const visitedHalls = new Set<string>();
  const orderedHallIds: string[] = [];

  let currentHall = hallIds[0];
  visitedHalls.add(currentHall);
  orderedHallIds.push(currentHall);

  while (visitedHalls.size < hallIds.length) {
    const remainingHalls = hallIds.filter((h) => !visitedHalls.has(h));

    let bestHall = remainingHalls[0];
    let bestScore = -Infinity;

    for (const nextHall of remainingHalls) {
      const priority = getConnectionPriority(currentHall, nextHall, connections);
      const connected = hallsAreConnected(currentHall, nextHall, connections);

      let score = priority;
      if (!connected) {
        score -= 1000;
      }

      if (score > bestScore) {
        bestScore = score;
        bestHall = nextHall;
      }
    }

    visitedHalls.add(bestHall);
    orderedHallIds.push(bestHall);
    currentHall = bestHall;
  }

  const result: TourStop[] = [];
  for (const hallId of orderedHallIds) {
    const hallStops = hallGroupedStops.get(hallId) || [];
    for (const stop of hallStops) {
      result.push(stop);
    }
  }

  return result;
}

export function generateValidationCenterReport(
  plan: TourPlan,
  exhibits: Exhibit[],
  halls: Hall[],
  connections: HallConnection[]
): ValidationCenterReport {
  const totalDuration = plan.stops.reduce((sum, s) => sum + s.duration, 0);
  const totalStops = plan.stops.length;

  const duplicateMap = new Map<string, number[]>();
  plan.stops.forEach((stop, idx) => {
    if (!duplicateMap.has(stop.exhibitId)) {
      duplicateMap.set(stop.exhibitId, []);
    }
    duplicateMap.get(stop.exhibitId)!.push(idx);
  });

  const duplicateExhibits: DuplicateDetail[] = Array.from(duplicateMap.entries())
    .filter(([, indices]) => indices.length > 1)
    .map(([exhibitId, indices]) => {
      const ex = exhibits.find((e) => e.id === exhibitId);
      return {
        exhibitId,
        exhibitName: ex?.name || exhibitId,
        indices,
      };
    });

  const disconnections: DisconnectionDetail[] = [];
  const jumps: JumpDetail[] = [];

  for (let i = 0; i < plan.stops.length - 1; i++) {
    const currStop = plan.stops[i];
    const nextStop = plan.stops[i + 1];
    const currEx = exhibits.find((e) => e.id === currStop.exhibitId);
    const nextEx = exhibits.find((e) => e.id === nextStop.exhibitId);

    if (!currEx || !nextEx) continue;

    if (currEx.hallId !== nextEx.hallId) {
      const currHall = halls.find((h) => h.id === currEx.hallId);
      const nextHall = halls.find((h) => h.id === nextEx.hallId);
      const connected = hallsAreConnected(currEx.hallId, nextEx.hallId, connections);
      const priority = getConnectionPriority(currEx.hallId, nextEx.hallId, connections);

      if (!connected) {
        disconnections.push({
          fromStopIndex: i,
          toStopIndex: i + 1,
          fromExhibitName: currEx.name,
          toExhibitName: nextEx.name,
          fromHallName: currHall?.name || currEx.hallId,
          toHallName: nextHall?.name || nextEx.hallId,
          reason: `展厅"${currHall?.name || currEx.hallId}"与"${nextHall?.name || nextEx.hallId}"之间没有定义连接通道`,
        });
      } else if (priority >= 0 && priority < 3) {
        jumps.push({
          fromStopIndex: i,
          toStopIndex: i + 1,
          fromExhibitName: currEx.name,
          toExhibitName: nextEx.name,
          fromHallName: currHall?.name || currEx.hallId,
          toHallName: nextHall?.name || nextEx.hallId,
        });
      }
    }
  }

  const pathMap = new Map<string, RepeatedPathDetail>();
  for (let i = 0; i < plan.stops.length - 1; i++) {
    const currEx = exhibits.find((e) => e.id === plan.stops[i].exhibitId);
    const nextEx = exhibits.find((e) => e.id === plan.stops[i + 1].exhibitId);
    if (!currEx || !nextEx || currEx.hallId === nextEx.hallId) continue;

    const rawKey = [currEx.hallId, nextEx.hallId];
    const sortedKey = [...rawKey].sort().join('<->');
    const currHall = halls.find((h) => h.id === rawKey[0]);
    const nextHall = halls.find((h) => h.id === rawKey[1]);

    if (!pathMap.has(sortedKey)) {
      pathMap.set(sortedKey, {
        fromHallName: currHall?.name || rawKey[0],
        toHallName: nextHall?.name || rawKey[1],
        count: 0,
        occurrences: [],
      });
    }
    const detail = pathMap.get(sortedKey)!;
    detail.count++;
    detail.occurrences.push({ fromIndex: i, toIndex: i + 1 });
  }

  const repeatedPaths: RepeatedPathDetail[] = Array.from(pathMap.values()).filter(
    (d) => d.count > 1
  );

  const hasCriticalIssues = duplicateExhibits.length > 0 || disconnections.length > 0;
  const hasWarnings = jumps.length > 0 || repeatedPaths.length > 0;

  return {
    totalDuration,
    totalStops,
    duplicateExhibits,
    disconnections,
    jumps,
    repeatedPaths,
    hasCriticalIssues,
    hasWarnings,
  };
}

export function generateImportPreviewData(
  config: RouteConfig,
  rawJson: string
): ImportPreviewData {
  const validation = validateImportConfig(config);

  const planValidationReports = config.plans.map((plan) => ({
    planName: plan.name,
    report: generateValidationCenterReport(
      plan,
      config.exhibits,
      config.halls,
      config.connections
    ),
  }));

  const totalStops = config.plans.reduce((sum, p) => sum + p.stops.length, 0);

  return {
    config,
    rawJson,
    validation,
    planValidationReports,
    summary: {
      hallsCount: config.halls.length,
      exhibitsCount: config.exhibits.length,
      connectionsCount: config.connections.length,
      plansCount: config.plans.length,
      totalStops,
    },
  };
}
