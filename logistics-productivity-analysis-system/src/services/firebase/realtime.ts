import { ref, onValue, push, set, remove, get, type Unsubscribe } from 'firebase/database';
import { db } from './config';
import type { Operator, Task, SeparacaoConfig, RessuprimentoConfig, AppSettings } from '../../types';

// ═══════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════
const PATHS = {
  operators: 'operators',
  separacaoTasks: 'tasks/separacao',
  ressuprimentoTasks: 'tasks/ressuprimento',
  separacaoConfig: 'configurations/separacao',
  ressuprimentoConfig: 'configurations/ressuprimento',
  settings: 'configurations/settings',
  alerts: 'alerts',
  importHistory: 'import-history',
  realtimeMonitor: 'realtime-monitor',
} as const;

// ═══════════════════════════════════════════
// GENERIC HELPERS
// ═══════════════════════════════════════════

/** Convert a Firebase snapshot of {key: val, ...} to an array with id field */
function snapshotToArray<T extends Record<string, unknown>>(
  snapshot: { val: () => Record<string, T> | null }
): (T & { id: string })[] {
  const val = snapshot.val();
  if (!val) return [];
  return Object.entries(val).map(([id, data]) => ({ ...data, id }) as (T & { id: string }));
}

/** Convert array to Firebase-compatible object keyed by id */
function arrayToFirebaseObject<T extends { id: string }>(items: T[]): Record<string, Omit<T, 'id'>> {
  const obj: Record<string, Omit<T, 'id'>> = {};
  for (const item of items) {
    const { id, ...rest } = item;
    obj[id] = rest;
  }
  return obj;
}

// ═══════════════════════════════════════════
// REAL-TIME LISTENERS
// ═══════════════════════════════════════════
// These attach Firebase listeners and call the provided callbacks
// whenever data changes. Returns unsubscribe functions.

export function listenToOperators(
  onUpdate: (operators: Operator[]) => void
): Unsubscribe {
  const path = ref(db, PATHS.operators);
  return onValue(path, (snapshot) => {
    const arr = snapshotToArray<Record<string, unknown>>(snapshot);
    onUpdate(arr.map((item) => ({
      id: item.id as string,
      name: item.name as string,
      module: item.module as 'separacao' | 'ressuprimento',
    })));
  }, () => {
    // Permission denied or no data — caller handles fallback
  });
}

export function listenToTasks(
  module: 'separacao' | 'ressuprimento',
  onUpdate: (tasks: Task[]) => void
): Unsubscribe {
  const pathKey = module === 'separacao' ? 'separacaoTasks' : 'ressuprimentoTasks';
  const path = ref(db, PATHS[pathKey]);
  return onValue(path, (snapshot) => {
    const arr = snapshotToArray<Record<string, unknown>>(snapshot);
    onUpdate(arr.map((item) => ({
      id: item.id as string,
      operatorId: item.operatorId as string,
      operatorName: item.operatorName as string,
      date: item.date as string,
      horaInicio: item.horaInicio as string,
      horaFim: item.horaFim as string,
      produto: item.produto as string,
      volumes: Number(item.volumes) || 0,
      tarefas: Number(item.tarefas) || 1,
      module: item.module as 'separacao' | 'ressuprimento',
    })));
  }, () => {
    // Error — fallback handled by caller
  });
}

export function listenToSeparacaoConfig(
  onUpdate: (config: SeparacaoConfig) => void
): Unsubscribe {
  const path = ref(db, PATHS.separacaoConfig);
  return onValue(path, (snapshot) => {
    const val = snapshot.val();
    if (val) onUpdate(val as SeparacaoConfig);
  }, () => {});
}

export function listenToRessuprimentoConfig(
  onUpdate: (config: RessuprimentoConfig) => void
): Unsubscribe {
  const path = ref(db, PATHS.ressuprimentoConfig);
  return onValue(path, (snapshot) => {
    const val = snapshot.val();
    if (val) onUpdate(val as RessuprimentoConfig);
  }, () => {});
}

export function listenToSettings(
  onUpdate: (settings: Partial<AppSettings>) => void
): Unsubscribe {
  const path = ref(db, PATHS.settings);
  return onValue(path, (snapshot) => {
    const val = snapshot.val();
    if (val) onUpdate(val as Partial<AppSettings>);
  }, () => {});
}

// ═══════════════════════════════════════════
// WRITE OPERATIONS
// ═══════════════════════════════════════════

/** Save all operators (replaces entire node) */
export async function saveOperators(operators: Operator[]): Promise<void> {
  const path = ref(db, PATHS.operators);
  await set(path, arrayToFirebaseObject(operators));
}

/** Add a single operator */
export async function addOperatorToFirebase(op: Operator): Promise<void> {
  const path = ref(db, `${PATHS.operators}/${op.id}`);
  await set(path, { name: op.name, module: op.module });
}

/** Remove operator */
export async function removeOperatorFromFirebase(id: string): Promise<void> {
  const path = ref(db, `${PATHS.operators}/${id}`);
  await remove(path);
}

/** Add tasks to a module */
export async function addTasksToFirebase(
  module: 'separacao' | 'ressuprimento',
  tasks: Task[]
): Promise<void> {
  const pathKey = module === 'separacao' ? 'separacaoTasks' : 'ressuprimentoTasks';
  const basePath = ref(db, PATHS[pathKey]);

  // Get existing count to append without overwriting
  const snapshot = await get(basePath);
  const existing = snapshot.val() || {};

  const updates: Record<string, unknown> = {};
  for (const task of tasks) {
    const newRef = push(ref(db, PATHS[pathKey]));
    updates[newRef.key!] = {
      operatorId: task.operatorId,
      operatorName: task.operatorName,
      date: task.date,
      horaInicio: task.horaInicio,
      horaFim: task.horaFim,
      produto: task.produto,
      volumes: task.volumes,
      tarefas: task.tarefas,
      module: task.module,
    };
  }

  // Merge with existing data
  await set(basePath, { ...existing, ...updates });
}

/** Clear tasks for a module */
export async function clearTasksInFirebase(
  scope: 'separacao' | 'ressuprimento' | 'all'
): Promise<void> {
  if (scope === 'separacao' || scope === 'all') {
    await remove(ref(db, PATHS.separacaoTasks));
  }
  if (scope === 'ressuprimento' || scope === 'all') {
    await remove(ref(db, PATHS.ressuprimentoTasks));
  }
}

/** Save configuration */
export async function saveSeparacaoConfig(config: SeparacaoConfig): Promise<void> {
  await set(ref(db, PATHS.separacaoConfig), config);
}

export async function saveRessuprimentoConfig(config: RessuprimentoConfig): Promise<void> {
  await set(ref(db, PATHS.ressuprimentoConfig), config);
}

/** Save app settings */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(ref(db, PATHS.settings), settings);
}

/** Push an alert to the alerts node for real-time monitoring */
export async function pushAlert(alert: {
  operatorName: string;
  type: string;
  message: string;
  timestamp: number;
}): Promise<void> {
  const path = ref(db, PATHS.alerts);
  await push(path, alert);
}

/** Save import history entry */
export async function saveImportHistory(entry: {
  date: string;
  module: string;
  records: number;
  operators: number;
  timestamp: number;
}): Promise<void> {
  const path = ref(db, PATHS.importHistory);
  await push(path, entry);
}

// ═══════════════════════════════════════════
// INITIALIZATION — Seed Firebase with defaults if empty
// ═══════════════════════════════════════════

export async function initializeFirebaseData(
  operators: Operator[],
  sepConfig: SeparacaoConfig,
  resConfig: RessuprimentoConfig,
  settings: AppSettings,
): Promise<void> {
  // Only write if nodes are empty (first run)
  const opsSnap = await get(ref(db, PATHS.operators));
  if (!opsSnap.exists()) {
    await saveOperators(operators);
  }

  const sepConfSnap = await get(ref(db, PATHS.separacaoConfig));
  if (!sepConfSnap.exists()) {
    await saveSeparacaoConfig(sepConfig);
  }

  const resConfSnap = await get(ref(db, PATHS.ressuprimentoConfig));
  if (!resConfSnap.exists()) {
    await saveRessuprimentoConfig(resConfig);
  }

  const settingsSnap = await get(ref(db, PATHS.settings));
  if (!settingsSnap.exists()) {
    await saveSettings(settings);
  }
}
