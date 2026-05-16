import type { Task, OperatorMetrics, AlertItem, SeparacaoConfig, RessuprimentoConfig } from './types';

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

export function timeToSeconds(time: string): number {
  const p = time.split(':');
  return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2] || '0');
}

export function timeToMinutes(time: string): number {
  return timeToSeconds(time) / 60;
}

export function secondsToTime(totalSeconds: number): string {
  const h = Math.floor(Math.abs(totalSeconds) / 3600);
  const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
  const s = Math.floor(Math.abs(totalSeconds) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// EXCEL CONVERSION — Precise date and time parsing
// ═══════════════════════════════════════════════════════════════

export function parseExcelDate(serial: number): string {
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseExcelTime(fraction: number): string {
  const totalSeconds = Math.round(fraction * 86400);
  return secondsToTime(totalSeconds);
}

export function parseDate(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number') {
    if (value > 30000 && value < 70000) return parseExcelDate(value);
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return '';
  }
  const str = String(value).trim();
  if (!str) return '';
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
  }
  return '';
}

export function parseTime(value: unknown): string {
  if (value == null || value === '') return '00:00:00';
  if (typeof value === 'number') {
    if (value >= 0 && value < 1) return parseExcelTime(value);
    if (value >= 1 && value < 24) return secondsToTime(value * 3600);
    return '00:00:00';
  }
  const str = String(value).trim();
  if (!str) return '00:00:00';
  const parts = str.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;
  }
  return '00:00:00';
}

// ═══════════════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════════════

export function filterTasks(tasks: Task[], filters: { operatorId: string; dataInicio: string; dataFim: string }): Task[] {
  return tasks.filter((t) => {
    if (filters.operatorId && t.operatorId !== filters.operatorId) return false;
    if (filters.dataInicio && t.date < filters.dataInicio) return false;
    if (filters.dataFim && t.date > filters.dataFim) return false;
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// DATA VALIDATION
// ═══════════════════════════════════════════════════════════════

export function validateTask(t: Task, config: SeparacaoConfig | RessuprimentoConfig): boolean {
  if (!t.operatorId || !t.operatorName || !t.date) return false;
  if (!t.horaInicio || !t.horaFim) return false;
  const startSec = timeToSeconds(t.horaInicio);
  const endSec = timeToSeconds(t.horaFim);
  if (startSec >= endSec) return false;
  if (t.volumes < 0 || t.tarefas <= 0) return false;
  // Check within shift hours
  const shiftStart = timeToSeconds(config.inicioExpediente);
  const shiftEnd = timeToSeconds(config.fimExpediente);
  if (startSec < shiftStart || endSec > shiftEnd + 3600) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════
// CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

export function classifyPerformance(performance: number): 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' {
  if (performance >= 110) return 'Excelente';
  if (performance >= 90) return 'Bom';
  if (performance >= 70) return 'Atenção';
  return 'Crítico';
}

// ═══════════════════════════════════════════════════════════════
// LUNCH OVERLAP CALCULATION
// ═══════════════════════════════════════════════════════════════
// Given a time interval [startSec, endSec], calculate the portion
// that overlaps with lunch. Returns the non-lunch duration in seconds.

function subtractLunch(startSec: number, endSec: number, almocoStart: number, almocoEnd: number): {
  productiveDuration: number;
  lunchDuration: number;
} {
  const totalDuration = endSec - startSec;
  if (totalDuration <= 0) return { productiveDuration: 0, lunchDuration: 0 };

  // No lunch overlap
  if (endSec <= almocoStart || startSec >= almocoEnd) {
    return { productiveDuration: totalDuration, lunchDuration: 0 };
  }

  // Entire interval is inside lunch
  if (startSec >= almocoStart && endSec <= almocoEnd) {
    return { productiveDuration: 0, lunchDuration: totalDuration };
  }

  // Calculate overlap
  const overlapStart = Math.max(startSec, almocoStart);
  const overlapEnd = Math.min(endSec, almocoEnd);
  const lunchDuration = overlapEnd - overlapStart;
  const productiveDuration = totalDuration - lunchDuration;

  return { productiveDuration: Math.max(0, productiveDuration), lunchDuration };
}

// ═══════════════════════════════════════════════════════════════
// CORE CALCULATION ENGINE — OPERATOR METRICS
// ═══════════════════════════════════════════════════════════════
// All metrics derived EXCLUSIVELY from real task records.
// Each task's duration = horaFim - horaInicio (consecutive model).
// Lunch periods are subtracted, never counted as idle.

export function calculateOperatorMetrics(
  tasks: Task[],
  operatorId: string,
  config: SeparacaoConfig | RessuprimentoConfig,
  module: 'separacao' | 'ressuprimento'
): OperatorMetrics {
  const empty: OperatorMetrics = {
    operatorId, operatorName: '', totalVolumes: 0, totalTarefas: 0,
    productiveHours: 0, idleHours: 0, productivity: 0, performance: 0,
    segVol: 0, volH: 0, classification: 'Crítico', idleTime: 0, alerts: 0,
  };

  // Get ONLY this operator's tasks
  const opTasks = tasks.filter((t) => t.operatorId === operatorId);
  if (opTasks.length === 0) return empty;

  const operatorName = opTasks[0].operatorName;
  const totalVolumes = opTasks.reduce((s, t) => s + t.volumes, 0);
  const totalTarefas = opTasks.length;

  // Sort by date then by time — chronological order within each day
  const sorted = [...opTasks].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio);
  });

  const almocoStart = timeToSeconds(config.inicioAlmoco);
  const almocoEnd = timeToSeconds(config.fimAlmoco);
  const shiftStart = timeToSeconds(config.inicioExpediente);
  const shiftEnd = timeToSeconds(config.fimExpediente);

  let totalProductiveSeconds = 0;
  let totalIdleSeconds = 0;
  let alertCount = 0;

  // For seg/vol calculation: only productive task durations
  let weightedSegVolNumerator = 0;
  let weightedSegVolDenominator = 0;

  for (let i = 0; i < sorted.length; i++) {
    const task = sorted[i];
    const startSec = timeToSeconds(task.horaInicio);
    const endSec = timeToSeconds(task.horaFim);

    // Validate: skip invalid intervals
    if (endSec <= startSec) continue;

    // Skip tasks entirely outside shift
    if (endSec <= shiftStart || startSec >= shiftEnd) continue;

    // Clamp to shift hours
    const clampedStart = Math.max(startSec, shiftStart);
    const clampedEnd = Math.min(endSec, shiftEnd);
    const rawDurationSec = clampedEnd - clampedStart;

    if (rawDurationSec <= 0) continue;

    // Subtract lunch from this interval
    const { productiveDuration, lunchDuration } = subtractLunch(clampedStart, clampedEnd, almocoStart, almocoEnd);

    // If entire interval is lunch, skip
    if (productiveDuration <= 0 && lunchDuration > 0) continue;

    const productiveDurationMin = productiveDuration / 60;

    // Determine if this interval is idle (>15min without lunch counting as productive)
    // We check raw duration minus lunch — if still > limit, it's idle
    if (productiveDurationMin > config.limiteOciosidade) {
      // This gap is IDLE (not lunch)
      totalIdleSeconds += productiveDuration;
      alertCount++;
    } else {
      // This is productive time
      totalProductiveSeconds += productiveDuration;

      if (productiveDurationMin > config.limiteAtencao) {
        alertCount++; // Attention alert
      }

      // Calculate seg/vol for this productive interval
      if (task.volumes > 0) {
        const taskSegVol = productiveDuration / task.volumes;
        weightedSegVolNumerator += taskSegVol * task.volumes;
        weightedSegVolDenominator += task.volumes;
      }
    }
  }

  // If no productive time found, return empty metrics
  if (totalProductiveSeconds <= 0 && totalIdleSeconds <= 0) return empty;

  const productiveHours = totalProductiveSeconds / 3600;
  const idleHours = totalIdleSeconds / 3600;

  // Weighted average seg/vol across all productive tasks
  const avgSegVol = weightedSegVolDenominator > 0
    ? weightedSegVolNumerator / weightedSegVolDenominator
    : 0;

  // ═══════ CALCULATIONS ═══════

  let productivity = 0; // vol/h or tasks/h
  let performance = 0;  // % based on parameter

  if (module === 'separacao') {
    const cfg = config as SeparacaoConfig;

    // Productivity: volumes per productive hour
    // Formula: (volumes / tempo_produtivo) * 3600
    productivity = productiveHours > 0 ? totalVolumes / productiveHours : 0;

    // Performance: parameter vs real
    // Formula: (segundos_parametro / segundos_reais) × 100
    if (avgSegVol > 0 && cfg.segundosPorVolume > 0) {
      performance = (cfg.segundosPorVolume / avgSegVol) * 100;
    }
  } else {
    const cfg = config as RessuprimentoConfig;

    // Productivity: tasks per productive hour
    productivity = productiveHours > 0 ? totalTarefas / productiveHours : 0;

    // Performance: parameter vs real
    // Real task time = productive seconds / number of productive tasks
    const avgTaskDurationMin = totalTarefas > 0 ? (totalProductiveSeconds / 60) / totalTarefas : 0;
    if (cfg.minutosPorTarefa > 0 && avgTaskDurationMin > 0) {
      performance = (cfg.minutosPorTarefa / avgTaskDurationMin) * 100;
    }
  }

  return {
    operatorId,
    operatorName,
    totalVolumes,
    totalTarefas,
    productiveHours: Math.round(productiveHours * 100) / 100,
    idleHours: Math.round(idleHours * 100) / 100,
    productivity: Math.round(productivity * 100) / 100,
    performance: Math.round(performance * 100) / 100,
    segVol: Math.round(avgSegVol * 100) / 100,
    volH: Math.round(productivity * 100) / 100,
    classification: classifyPerformance(performance),
    idleTime: Math.round((totalIdleSeconds / 60) * 100) / 100,
    alerts: alertCount,
  };
}

// ═══════════════════════════════════════════════════════════════
// ALERTS — DERIVED EXCLUSIVELY FROM REAL TASK RECORDS
// ═══════════════════════════════════════════════════════════════
// Each task interval is examined:
// - If it spans lunch → exclude lunch, classify based on remainder
// - If remainder > limiteOciosidade → OCIOSIDADE
// - If remainder > limiteAtencao → AVISO
// - Otherwise → NORMAL
// NO alerts are generated without real task records.

export function generateAlerts(
  tasks: Task[],
  config: SeparacaoConfig | RessuprimentoConfig
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Group by operator + date
  const byOperatorDate = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = `${t.operatorId}__${t.date}`;
    if (!byOperatorDate.has(key)) byOperatorDate.set(key, []);
    byOperatorDate.get(key)!.push(t);
  }

  // Sort each group chronologically
  for (const [, group] of byOperatorDate) {
    group.sort((a, b) => timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio));
  }

  const almocoStartSec = timeToSeconds(config.inicioAlmoco);
  const almocoEndSec = timeToSeconds(config.fimAlmoco);
  const shiftStartSec = timeToSeconds(config.inicioExpediente);
  const shiftEndSec = timeToSeconds(config.fimExpediente);

  for (const [, group] of byOperatorDate) {
    for (let i = 0; i < group.length; i++) {
      const task = group[i];
      const startSec = timeToSeconds(task.horaInicio);
      const endSec = timeToSeconds(task.horaFim);

      // Skip invalid or out-of-shift intervals
      if (endSec <= startSec) continue;
      if (endSec <= shiftStartSec || startSec >= shiftEndSec) continue;

      // Clamp to shift
      const clampedStart = Math.max(startSec, shiftStartSec);
      const clampedEnd = Math.min(endSec, shiftEndSec);
      const rawDurationSec = clampedEnd - clampedStart;

      if (rawDurationSec <= 0) continue;

      // Subtract lunch
      const { productiveDuration, lunchDuration } = subtractLunch(clampedStart, clampedEnd, almocoStartSec, almocoEndSec);

      // If entirely lunch, mark as ALMOÇO and skip alert logic
      if (productiveDuration <= 0 && lunchDuration > 0) {
        alerts.push({
          id: `task-${task.id}`,
          operatorId: task.operatorId,
          operatorName: task.operatorName,
          date: task.date,
          horaInicio: task.horaInicio,
          horaFim: task.horaFim,
          duracao: rawDurationSec,
          volumes: task.volumes,
          tarefas: task.tarefas,
          segVol: 0,
          classificacao: 'Almoço',
          tipoAlerta: 'ALMOÇO',
        });
        continue;
      }

      const productiveDurationMin = productiveDuration / 60;
      const segVol = task.volumes > 0 ? productiveDuration / task.volumes : 0;

      let classificacao: AlertItem['classificacao'] = 'Normal';
      let tipoAlerta = 'NORMAL';

      if (productiveDurationMin > config.limiteOciosidade) {
        classificacao = 'Ociosidade';
        tipoAlerta = 'OCIOSIDADE';
      } else if (productiveDurationMin > config.limiteAtencao) {
        classificacao = 'Aviso';
        tipoAlerta = 'AVISO';
      }

      alerts.push({
        id: `task-${task.id}`,
        operatorId: task.operatorId,
        operatorName: task.operatorName,
        date: task.date,
        horaInicio: task.horaInicio,
        horaFim: task.horaFim,
        duracao: rawDurationSec,
        volumes: task.volumes,
        tarefas: task.tarefas,
        segVol: Math.round(segVol * 100) / 100,
        classificacao,
        tipoAlerta,
      });
    }
  }

  return alerts;
}

// ═══════════════════════════════════════════════════════════════
// HEATMAP — Uses ACTUAL dates from records
// ═══════════════════════════════════════════════════════════════

export function getHeatmapData(tasks: Task[]): { hour: number; day: string; value: number; count: number }[] {
  // Collect all unique dates from actual task records
  const uniqueDates = [...new Set(tasks.map((t) => t.date))].sort();
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Create cells for each unique date + hour combination
  const data: { hour: number; day: string; value: number; count: number }[] = [];

  for (const dateStr of uniqueDates) {
    const taskDate = new Date(dateStr + 'T12:00:00');
    const dayStr = dayNames[taskDate.getDay()];
    for (let h = 6; h <= 18; h++) {
      data.push({ hour: h, day: dayStr, value: 0, count: 0 });
    }
  }

  // Aggregate task volumes into correct date+hour cells
  for (const task of tasks) {
    const taskDate = new Date(task.date + 'T12:00:00');
    const dayStr = dayNames[taskDate.getDay()];
    const startHour = parseInt(task.horaInicio.split(':')[0]);
    const endHour = parseInt(task.horaFim.split(':')[0]);

    for (let h = startHour; h <= Math.min(endHour, 18); h++) {
      if (h < 6) continue;
      const cell = data.find((c) => c.hour === h && c.day === dayStr);
      if (cell) {
        cell.value += task.volumes;
        cell.count += 1;
      }
    }
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// INSIGHTS — Derived from real data only
// ═══════════════════════════════════════════════════════════════

export function generateInsights(
  tasks: Task[],
  metrics: OperatorMetrics[],
  module: 'separacao' | 'ressuprimento'
): string[] {
  const insights: string[] = [];
  if (tasks.length === 0) return ['Nenhum dado disponível para análise no período selecionado.'];

  const activeMetrics = metrics.filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0);
  if (activeMetrics.length === 0) return ['Sem métricas disponíveis.'];

  const totalVolumes = tasks.reduce((s, t) => s + t.volumes, 0);
  const totalTarefas = tasks.length;
  const avgPerf = activeMetrics.reduce((s, m) => s + m.performance, 0) / activeMetrics.length;
  const bestOp = activeMetrics.reduce((a, b) => (a.performance > b.performance ? a : b));
  const worstOp = activeMetrics.reduce((a, b) => (a.performance < b.performance ? a : b));
  const idleOps = activeMetrics.filter((m) => m.idleTime > 0);
  const excellentOps = activeMetrics.filter((m) => m.classification === 'Excelente');
  const criticalOps = activeMetrics.filter((m) => m.classification === 'Crítico');
  const moduleLabel = module === 'separacao' ? 'Separação' : 'Ressuprimento';

  // Performance insight
  insights.push(`📊 Desempenho médio da equipe ${moduleLabel}: ${avgPerf.toFixed(1)}%`);

  // Best operator
  if (bestOp.operatorName && bestOp.performance > 0) {
    insights.push(`🏆 ${bestOp.operatorName} lidera com ${bestOp.performance.toFixed(1)}% de desempenho — ${bestOp.totalVolumes} volumes em ${bestOp.totalTarefas} tarefas.`);
  }

  // Worst operator
  if (worstOp.operatorName && worstOp.operatorId !== bestOp.operatorId && worstOp.performance > 0) {
    insights.push(`⚠️ ${worstOp.operatorName} requer atenção: ${worstOp.performance.toFixed(1)}% de desempenho.`);
  }

  // Totals
  if (module === 'separacao') {
    insights.push(`📦 Total: ${totalVolumes.toLocaleString()} volumes processados em ${totalTarefas} tarefas.`);
  } else {
    insights.push(`📋 Total: ${totalTarefas.toLocaleString()} tarefas executadas no período.`);
  }

  if (idleOps.length > 0) {
    insights.push(`🔴 ${idleOps.length} operador(es) com tempo ocioso detectado.`);
  }
  if (excellentOps.length > 0) {
    insights.push(`✨ ${excellentOps.length} operador(es) com classificação Excelente.`);
  }
  if (criticalOps.length > 0) {
    insights.push(`🚨 ${criticalOps.length} operador(es) em situação Crítica — ação necessária.`);
  }

  // Hour analysis — from real data
  const hourMap = new Map<number, { volumes: number; count: number }>();
  for (const t of tasks) {
    const h = parseInt(t.horaInicio.split(':')[0]);
    const existing = hourMap.get(h) || { volumes: 0, count: 0 };
    existing.volumes += t.volumes;
    existing.count += 1;
    hourMap.set(h, existing);
  }
  const hourEntries = [...hourMap.entries()].sort((a, b) => b[1].volumes - a[1].volumes);
  if (hourEntries.length > 0) {
    insights.push(`⏰ Horário mais produtivo: ${hourEntries[0][0]}h com ${hourEntries[0][1].volumes.toLocaleString()} volumes.`);
    if (hourEntries.length > 1) {
      const worst = hourEntries[hourEntries.length - 1];
      if (worst[0] !== hourEntries[0][0]) {
        insights.push(`📉 Horário crítico: ${worst[0]}h com apenas ${worst[1].volumes.toLocaleString()} volumes.`);
      }
    }
  }

  // Trend — compare last two real dates
  const byDate = new Map<string, number>();
  for (const t of tasks) byDate.set(t.date, (byDate.get(t.date) || 0) + t.volumes);
  const dateEntries = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (dateEntries.length >= 2) {
    const last = dateEntries[dateEntries.length - 1][1];
    const prev = dateEntries[dateEntries.length - 2][1];
    const change = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    if (Math.abs(change) > 5) {
      insights.push(`📈 Tendência: ${change > 0 ? 'alta' : 'queda'} de ${Math.abs(change).toFixed(1)}% em relação ao dia anterior (${dateEntries[dateEntries.length - 2][0].slice(5)}).`);
    }
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// IMPORT COLUMN DETECTION
// ═══════════════════════════════════════════════════════════════

export function findColumn(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of Object.keys(row)) {
    const normalized = key.trim().toUpperCase().replace(/[\s_]+/g, '_');
    for (const candidate of candidates) {
      const cNorm = candidate.trim().toUpperCase().replace(/[\s_]+/g, '_');
      if (normalized === cNorm) return row[key];
    }
  }
  return undefined;
}

export function detectSetor(value: unknown): 'separacao' | 'ressuprimento' {
  if (value == null) return 'separacao';
  const str = String(value).trim().toLowerCase();
  if (str.includes('res') || str.includes('ress') || str.includes('supr')) return 'ressuprimento';
  return 'separacao';
}

// ═══════════════════════════════════════════════════════════════
// RAW IMPORT → PROCESSED TASKS
// ═══════════════════════════════════════════════════════════════

export interface RawImportRow {
  usuario: string;
  date: string;
  horaInicio: string;
  produto: string;
  volumes: number;
}

export function processRawImportedTasks(
  rawRows: RawImportRow[],
  module: 'separacao' | 'ressuprimento',
  operators: { id: string; name: string }[],
  // endShiftTime is no longer used — last task stays PENDING (horaFim = horaInicio)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _endShiftTime: string,
): Task[] {
  // Group by user + date
  const groups = new Map<string, RawImportRow[]>();
  for (const row of rawRows) {
    if (!row.usuario || !row.date || !row.horaInicio) continue;
    const key = `${row.usuario.trim().toUpperCase()}__${row.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const tasks: Task[] = [];

  for (const [, rows] of groups) {
    // Sort chronologically within each user+date group
    rows.sort((a, b) => timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio));

    const operatorName = rows[0].usuario.trim();
    const matchingOp = operators.find((op) =>
      op.name.toUpperCase().includes(operatorName.toUpperCase()) ||
      operatorName.toUpperCase().includes(op.name.toUpperCase())
    );
    const operatorId = matchingOp?.id || `unk-${operatorName.replace(/\s/g, '-')}`;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // ═══ CRITICAL FIX ═══
      // Duration = next task's horaInicio - this task's horaInicio
      // For the LAST task: horaFim = horaInicio (PENDING — zero duration)
      // This task is NOT complete until the next task arrives or idle timeout passes.
      // The system will NEVER assume this task lasted until end of shift.
      const horaFim = i < rows.length - 1
        ? rows[i + 1].horaInicio
        : row.horaInicio; // PENDING — awaiting next task or idle timeout

      tasks.push({
        id: `imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        operatorId,
        operatorName,
        date: row.date,
        horaInicio: row.horaInicio,
        horaFim,
        produto: row.produto || 'N/A',
        volumes: row.volumes,
        tarefas: 1,
        module,
      });
    }
  }

  return tasks;
}

// ═══════════════════════════════════════════════════════════════
// INCREMENTAL REPROCESSING
// ═══════════════════════════════════════════════════════════════
// When new tasks arrive, find and fix any PENDING last tasks
// for matching operator+date, then append the new tasks.
// This ensures no false projections remain.

export function reprocessAndMergeTasks(
  existingTasks: Task[],
  newTasks: Task[],
): Task[] {
  const merged = [...existingTasks];

  // Group new tasks by operatorId + date
  const byKey = new Map<string, Task[]>();
  for (const t of newTasks) {
    const key = `${t.operatorId}__${t.date}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(t);
  }

  // For each group, check if the last existing task is PENDING
  for (const [key, group] of byKey) {
    // Sort new tasks by time
    group.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio);
    });

    // Find last existing task for this operator+date
    const matching = merged
      .filter((t) => `${t.operatorId}__${t.date}` === key)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio);
      });

    if (matching.length > 0) {
      const last = matching[matching.length - 1];
      // If PENDING (horaFim === horaInicio), update it with new task's horaInicio
      if (last.horaFim === last.horaInicio) {
        const firstNew = group[0];
        if (firstNew) {
          const idx = merged.findIndex((t) => t.id === last.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], horaFim: firstNew.horaInicio };
          }
        }
      }
    }
  }

  return [...merged, ...newTasks];
}

// ═══════════════════════════════════════════════════════════════
// REAL-TIME IDLE STATUS CHECK
// ═══════════════════════════════════════════════════════════════
// Checks actual elapsed time since each operator's last activity.
// Only generates states based on REAL elapsed time, never projections.
// Returns idle statuses for operators whose last task is PENDING
// and time has exceeded configured thresholds.

import type { IdleStatus, OperatorState } from './types';

export function checkRealtimeIdleStatus(
  operators: { id: string; name: string; module: 'separacao' | 'ressuprimento' }[],
  separacaoTasks: Task[],
  ressuprimentoTasks: Task[],
  separacaoConfig: SeparacaoConfig,
  ressuprimentoConfig: RessuprimentoConfig,
): IdleStatus[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const statuses: IdleStatus[] = [];

  for (const op of operators) {
    const tasks = op.module === 'separacao' ? separacaoTasks : ressuprimentoTasks;
    const config = op.module === 'separacao' ? separacaoConfig : ressuprimentoConfig;

    // Get today's tasks for this operator
    const todayTasks = tasks
      .filter((t) => t.operatorId === op.id && t.date === todayStr)
      .sort((a, b) => timeToSeconds(a.horaInicio) - timeToSeconds(b.horaInicio));

    if (todayTasks.length === 0) continue;

    const lastTask = todayTasks[todayTasks.length - 1];
    const shiftStart = timeToSeconds(config.inicioExpediente);
    const shiftEnd = timeToSeconds(config.fimExpediente);
    const lunchStart = timeToSeconds(config.inicioAlmoco);
    const lunchEnd = timeToSeconds(config.fimAlmoco);

    // OFF_SHIFT: before or after shift
    if (currentSec < shiftStart || currentSec > shiftEnd) {
      continue; // Don't report off-shift operators
    }

    // Determine the last known activity time
    const lastActivitySec = lastTask.horaFim !== lastTask.horaInicio
      ? timeToSeconds(lastTask.horaFim)
      : timeToSeconds(lastTask.horaInicio);

    const elapsed = currentSec - lastActivitySec;

    // LUNCH_BREAK: currently in lunch period
    if (currentSec >= lunchStart && currentSec <= lunchEnd) {
      // Only report if the operator was active before lunch
      if (lastActivitySec > 0 && lastActivitySec < lunchEnd) {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'LUNCH_BREAK' as OperatorState,
          lastActivity: lastTask.horaFim !== lastTask.horaInicio ? lastTask.horaFim : lastTask.horaInicio,
          elapsedSeconds: 0,
          module: op.module,
        });
      }
      continue;
    }

    // Only check idle for PENDING tasks (horaFim === horaInicio)
    // Completed tasks don't need real-time monitoring unless there's a gap after them
    if (lastTask.horaFim === lastTask.horaInicio) {
      // PENDING task — check elapsed time from horaInicio
      if (elapsed > config.limiteOciosidade * 60) {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'IDLE',
          lastActivity: lastTask.horaInicio,
          elapsedSeconds: elapsed,
          module: op.module,
        });
      } else if (elapsed > config.limiteAtencao * 60) {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'ATTENTION',
          lastActivity: lastTask.horaInicio,
          elapsedSeconds: elapsed,
          module: op.module,
        });
      } else {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'WAITING_NEXT_TASK',
          lastActivity: lastTask.horaInicio,
          elapsedSeconds: elapsed,
          module: op.module,
        });
      }
    } else {
      // Task is completed — check gap since completion
      const gapSec = currentSec - timeToSeconds(lastTask.horaFim);
      if (gapSec > config.limiteOciosidade * 60) {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'IDLE',
          lastActivity: lastTask.horaFim,
          elapsedSeconds: gapSec,
          module: op.module,
        });
      } else if (gapSec > config.limiteAtencao * 60) {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'ATTENTION',
          lastActivity: lastTask.horaFim,
          elapsedSeconds: gapSec,
          module: op.module,
        });
      } else {
        statuses.push({
          operatorId: op.id,
          operatorName: op.name,
          state: 'ACTIVE',
          lastActivity: lastTask.horaFim,
          elapsedSeconds: gapSec,
          module: op.module,
        });
      }
    }
  }

  return statuses;
}
