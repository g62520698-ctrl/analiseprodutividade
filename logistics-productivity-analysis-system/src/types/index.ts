export interface ProcessedRecord {
  id: string;
  usuario: string;
  data: string;
  hora: string;
  volumes: number;
  timestamp: number;
}

export interface SeparatorDaily {
  usuario: string;
  data: string;
  totalVolumes: number;
  tempoProdutivo: number;
  tempoOcioso: number;
  tempoAlmoco: number;
  produtividade: number;
  tempoMedioSeg: number;
  desempenho: number;
  jornadaTotal: number;
  registros: number;
}

export interface KPIData {
  totalVolumes: number;
  totalProdutivo: number;
  totalOcioso: number;
  produtividade: number;
  tempoMedioSeg: number;
  desempenho: number;
  jornadaTotal: number;
  totalRegistros: number;
  separadoresAtivos: number;
}

export interface Separator {
  id: string;
  nome: string;
  ruas: string;
  ativo: boolean;
}

export interface DetailedAlert {
  id: string;
  usuario: string;
  data: string;
  tipo: 'tarefa' | 'intervalo' | 'ociosidade' | 'ociosidade_final' | 'almoco' | 'baixo_desempenho' | 'queda';
  horaInicio: string;
  horaFim: string;
  duracaoMin: number;
  volumes: number;
  tempoPorVolSeg: number;
  mensagem: string;
  severidade: 'info' | 'warning' | 'high';
  lido: boolean;
}

export type FilterPeriod = 'diario' | 'semanal' | 'mensal';
export type PageType = 'dashboard' | 'importar' | 'ranking' | 'alertas' | 'separadores';
