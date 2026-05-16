export interface Operator {
  id: string;
  name: string;
  module: 'separacao' | 'ressuprimento';
}

export interface Task {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  horaInicio: string;
  horaFim: string;
  produto: string;
  volumes: number;
  tarefas: number;
  module: 'separacao' | 'ressuprimento';
}

export interface SeparacaoConfig {
  segundosPorVolume: number;
  volumesPorHora: number;
  limiteAtencao: number;
  limiteOciosidade: number;
  inicioExpediente: string;
  fimExpediente: string;
  inicioAlmoco: string;
  fimAlmoco: string;
}

export interface RessuprimentoConfig {
  minutosPorTarefa: number;
  tarefasPorHora: number;
  limiteAtencao: number;
  limiteOciosidade: number;
  inicioExpediente: string;
  fimExpediente: string;
  inicioAlmoco: string;
  fimAlmoco: string;
}

export interface Filters {
  operatorId: string;
  dataInicio: string;
  dataFim: string;
}

export interface AlertItem {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  horaInicio: string;
  horaFim: string;
  duracao: number;
  produto: string;
  volumes: number;
  tarefas: number;
  segVol: number;
  classificacao: 'Normal' | 'Aviso' | 'Ociosidade' | 'Almoço';
  tipoAlerta: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export interface NotificationItem {
  id: string;
  type: 'attention' | 'critical' | 'info' | 'success';
  operatorName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export type PageType = 'painel' | 'separacao' | 'ressuprimento' | 'configuracoes';
export type ThemeType = 'dark' | 'light';
export type CalcMode = 'volumes' | 'tarefas';

export interface AppSettings {
  theme: ThemeType;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  browserNotifications: boolean;
  realtimeEnabled: boolean;
  calcMode: CalcMode;
}

export interface OperatorMetrics {
  operatorId: string;
  operatorName: string;
  totalVolumes: number;
  totalTarefas: number;
  productiveHours: number;
  idleHours: number;
  productivity: number;
  performance: number;
  segVol: number;
  volH: number;
  classification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  idleTime: number;
  alerts: number;
}

export interface HeatmapCell {
  hour: number;
  day: string;
  value: number;
  label: string;
}

export type OperatorState = 'ACTIVE' | 'WAITING_NEXT_TASK' | 'ATTENTION' | 'IDLE' | 'OFF_SHIFT' | 'LUNCH_BREAK';

export interface IdleStatus {
  operatorId: string;
  operatorName: string;
  state: OperatorState;
  lastActivity: string;
  elapsedSeconds: number;
  module: 'separacao' | 'ressuprimento';
}
