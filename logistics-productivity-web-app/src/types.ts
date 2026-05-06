export interface SeparationRecord {
  id?: string;
  usuario: string;
  data: string;
  hora: string;
  volumes: number;
  datetime: string;
}

export interface IntervalDetail {
  inicio: string;
  fim: string;
  intervaloMin: number;
  volumes: number;
  tipo: 'produtivo' | 'ocioso' | 'almoco';
  segVol: number;
}

export interface DaySummary {
  usuario: string;
  data: string;
  volumes: number;
  tempoProdutivoSeg: number;
  tempoOciosoSeg: number;
  volHora: number;
  segVol: number;
  volSeg: number;
  desempenho: number;
  intervalos: IntervalDetail[];
}

export interface AlertItem {
  id: string;
  usuario: string;
  data: string;
  tarefa: string;
  intervalo: number;
  volumes: number;
  segVol: number;
  tipo: 'aviso' | 'ocioso' | 'info';
}

export interface InsightItem {
  tipo: 'warning' | 'danger' | 'success' | 'info';
  titulo: string;
  mensagem: string;
  icone: string;
}

export type FilterPeriod = 'dia' | 'semana' | 'mes' | '';
export type PageView = 'dashboard' | 'importar' | 'ranking' | 'alertas' | 'insights' | 'evolucao' | 'exportar' | 'dados';

export interface AppFilters {
  periodo: FilterPeriod;
  dataInicio: string;
  dataFim: string;
  usuario: string;
}
