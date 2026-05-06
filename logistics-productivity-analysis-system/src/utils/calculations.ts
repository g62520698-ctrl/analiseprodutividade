import dayjs from 'dayjs';
import type { SeparationRecord, DaySummary, IntervalDetail, AlertItem, InsightItem } from '../types';

const ALMOCO_INICIO = '11:30:00';
const ALMOCO_FIM = '12:45:00';
const LIMITE_PRODUTIVO_MIN = 20;
const VOLUME_ESPECIAL = 20;
const TEMPO_POR_VOLUME_SEG = 10;
const FIM_DIA = '17:15:00';

function getAlmocoOverlap(inicio: dayjs.Dayjs, fim: dayjs.Dayjs, data: string): number {
  const almocoInicio = dayjs(`${data} ${ALMOCO_INICIO}`);
  const almocoFim = dayjs(`${data} ${ALMOCO_FIM}`);

  const overlapInicio = inicio.isAfter(almocoInicio) ? inicio : almocoInicio;
  const overlapFim = fim.isBefore(almocoFim) ? fim : almocoFim;

  if (overlapFim.isAfter(overlapInicio)) {
    return overlapFim.diff(overlapInicio, 'second');
  }
  return 0;
}

export function calculateDaySummary(records: SeparationRecord[]): DaySummary {
  const emptySummary: DaySummary = {
    usuario: '',
    data: '',
    volumes: 0,
    tempoProdutivoSeg: 0,
    tempoOciosoSeg: 0,
    volHora: 0,
    segVol: 0,
    volSeg: 0,
    desempenho: 0,
    intervalos: [],
  };

  if (records.length === 0) return emptySummary;

  const sorted = [...records].sort((a, b) =>
    dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf()
  );

  let tempoProdutivoSeg = 0;
  let tempoOciosoSeg = 0;
  let totalVolumes = 0;
  const intervalos: IntervalDetail[] = [];

  for (let i = 0; i < sorted.length; i++) {
    totalVolumes += sorted[i].volumes;

    if (i < sorted.length - 1) {
      const atual = dayjs(sorted[i].datetime);
      const proximo = dayjs(sorted[i + 1].datetime);
      const data = sorted[i].data;

      const intervaloTotalSeg = proximo.diff(atual, 'second');
      const almocoSeg = getAlmocoOverlap(atual, proximo, data);
      const effectiveIntervalSeg = Math.max(0, intervaloTotalSeg - almocoSeg);
      const effectiveIntervalMin = effectiveIntervalSeg / 60;

      // Special rule: if volumes > 20, use 10 seconds per volume
      if (sorted[i].volumes > VOLUME_ESPECIAL) {
        const tempoCalculadoSeg = sorted[i].volumes * TEMPO_POR_VOLUME_SEG;
        const tempoProdutivoDeste = Math.min(tempoCalculadoSeg, effectiveIntervalSeg);
        tempoProdutivoSeg += tempoProdutivoDeste;

        intervalos.push({
          inicio: sorted[i].hora,
          fim: sorted[i + 1].hora,
          intervaloMin: Math.round(effectiveIntervalMin * 100) / 100,
          volumes: sorted[i].volumes,
          tipo: 'produtivo',
          segVol: sorted[i].volumes > 0
            ? Math.round((tempoProdutivoDeste / sorted[i].volumes) * 100) / 100
            : 0,
        });
      } else if (effectiveIntervalSeg <= LIMITE_PRODUTIVO_MIN * 60) {
        // Productive interval (≤20 min)
        tempoProdutivoSeg += effectiveIntervalSeg;
        const segVol = sorted[i].volumes > 0
          ? effectiveIntervalSeg / sorted[i].volumes
          : 0;
        intervalos.push({
          inicio: sorted[i].hora,
          fim: sorted[i + 1].hora,
          intervaloMin: Math.round(effectiveIntervalMin * 100) / 100,
          volumes: sorted[i].volumes,
          tipo: 'produtivo',
          segVol: Math.round(segVol * 100) / 100,
        });
      } else {
        // Idle interval (>20 min)
        tempoOciosoSeg += effectiveIntervalSeg;
        intervalos.push({
          inicio: sorted[i].hora,
          fim: sorted[i + 1].hora,
          intervaloMin: Math.round(effectiveIntervalMin * 100) / 100,
          volumes: sorted[i].volumes,
          tipo: 'ocioso',
          segVol: 0,
        });
      }
    }
  }

  // Idle time from last record to 17:00
  const lastRecord = sorted[sorted.length - 1];
  const ultimo = dayjs(lastRecord.datetime);
  const fimDia = dayjs(`${lastRecord.data} ${FIM_DIA}`);

  if (ultimo.isBefore(fimDia)) {
    let restanteSeg = fimDia.diff(ultimo, 'second');
    const almocoSeg = getAlmocoOverlap(ultimo, fimDia, lastRecord.data);
    restanteSeg = Math.max(0, restanteSeg - almocoSeg);
    tempoOciosoSeg += restanteSeg;
  }

  const segVol = totalVolumes > 0 ? tempoProdutivoSeg / totalVolumes : 0;
  const volHora = tempoProdutivoSeg > 0 ? totalVolumes / (tempoProdutivoSeg / 3600) : 0;
  const volSeg = tempoProdutivoSeg > 0 ? totalVolumes / tempoProdutivoSeg : 0;
  const desempenho = segVol > 0 ? (30 / segVol) * 100 : 0;

  return {
    usuario: sorted[0].usuario,
    data: sorted[0].data,
    volumes: totalVolumes,
    tempoProdutivoSeg,
    tempoOciosoSeg,
    volHora: Math.round(volHora * 100) / 100,
    segVol: Math.round(segVol * 100) / 100,
    volSeg: Math.round(volSeg * 10000) / 10000,
    desempenho: Math.round(desempenho * 100) / 100,
    intervalos,
  };
}

export function calculateAllSummaries(records: SeparationRecord[]): DaySummary[] {
  const groups: Record<string, SeparationRecord[]> = {};

  for (const record of records) {
    const key = `${record.usuario}|||${record.data}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  }

  return Object.values(groups)
    .map(calculateDaySummary)
    .filter(s => s.usuario !== '')
    .sort((a, b) => {
      const dateComp = a.data.localeCompare(b.data);
      if (dateComp !== 0) return dateComp;
      return a.usuario.localeCompare(b.usuario);
    });
}

export function generateAlerts(summaries: DaySummary[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const summary of summaries) {
    for (const intervalo of summary.intervalos) {
      if (intervalo.tipo === 'ocioso' && intervalo.intervaloMin > 20) {
        alerts.push({
          id: `${summary.usuario}-${summary.data}-${intervalo.inicio}-ocioso`,
          usuario: summary.usuario,
          data: summary.data,
          tarefa: `${intervalo.inicio} → ${intervalo.fim}`,
          intervalo: intervalo.intervaloMin,
          volumes: intervalo.volumes,
          segVol: intervalo.segVol,
          tipo: 'ocioso',
        });
      } else if (intervalo.intervaloMin > 2 && intervalo.volumes > 0 && intervalo.tipo === 'produtivo') {
        alerts.push({
          id: `${summary.usuario}-${summary.data}-${intervalo.inicio}-aviso`,
          usuario: summary.usuario,
          data: summary.data,
          tarefa: `${intervalo.inicio} → ${intervalo.fim}`,
          intervalo: intervalo.intervaloMin,
          volumes: intervalo.volumes,
          segVol: intervalo.segVol,
          tipo: 'aviso',
        });
      }
    }
  }

  return alerts.sort((a, b) => {
    if (a.tipo === 'ocioso' && b.tipo !== 'ocioso') return -1;
    if (a.tipo !== 'ocioso' && b.tipo === 'ocioso') return 1;
    return b.intervalo - a.intervalo;
  });
}

export function generateInsights(summaries: DaySummary[]): InsightItem[] {
  const insights: InsightItem[] = [];
  if (summaries.length === 0) return insights;

  const avgDesempenho =
    summaries.reduce((s, d) => s + d.desempenho, 0) / summaries.length;

  // Group by user
  const byUser: Record<string, DaySummary[]> = {};
  for (const s of summaries) {
    if (!byUser[s.usuario]) byUser[s.usuario] = [];
    byUser[s.usuario].push(s);
  }

  for (const [usuario, userSummaries] of Object.entries(byUser)) {
    const sortedS = [...userSummaries].sort((a, b) => a.data.localeCompare(b.data));
    const userAvg = sortedS.reduce((s, d) => s + d.desempenho, 0) / sortedS.length;

    // Performance drop (≥20%)
    if (sortedS.length >= 2) {
      const last = sortedS[sortedS.length - 1];
      const prev = sortedS[sortedS.length - 2];
      if (prev.desempenho > 0) {
        const drop = ((prev.desempenho - last.desempenho) / prev.desempenho) * 100;
        if (drop >= 20) {
          insights.push({
            tipo: 'warning',
            titulo: `📉 ${usuario} caiu ${Math.round(drop)}%`,
            mensagem: `Desempenho caiu de ${prev.desempenho.toFixed(1)}% para ${last.desempenho.toFixed(1)}% em ${last.data}`,
            icone: '📉',
          });
        }
      }
    }

    // High idleness (>50%)
    const totalOcioso = sortedS.reduce((s, d) => s + d.tempoOciosoSeg, 0);
    const totalProdutivo = sortedS.reduce((s, d) => s + d.tempoProdutivoSeg, 0);
    const totalTempo = totalOcioso + totalProdutivo;
    if (totalTempo > 0) {
      const ociosoPercent = (totalOcioso / totalTempo) * 100;
      if (ociosoPercent > 50) {
        insights.push({
          tipo: 'danger',
          titulo: `🔴 Alta ociosidade: ${usuario}`,
          mensagem: `${ociosoPercent.toFixed(1)}% do tempo total está ocioso`,
          icone: '🔴',
        });
      }
    }

    // Above average (>120%)
    if (userAvg > avgDesempenho * 1.2 && userAvg > 0) {
      insights.push({
        tipo: 'success',
        titulo: `🏆 ${usuario} acima da média`,
        mensagem: `Desempenho: ${userAvg.toFixed(1)}% (média geral: ${avgDesempenho.toFixed(1)}%)`,
        icone: '🏆',
      });
    }

    // Irregular rhythm
    if (sortedS.length >= 3) {
      const values = sortedS.map(d => d.desempenho);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > mean * 0.3 && mean > 0) {
        insights.push({
          tipo: 'warning',
          titulo: `📊 Ritmo irregular: ${usuario}`,
          mensagem: `Variação: ±${stdDev.toFixed(1)}% (média: ${mean.toFixed(1)}%)`,
          icone: '📊',
        });
      }
    }

    // Suspicious peak
    const maxDesemp = Math.max(...sortedS.map(d => d.desempenho));
    if (maxDesemp > avgDesempenho * 2 && avgDesempenho > 0) {
      const peakDay = sortedS.find(d => d.desempenho === maxDesemp);
      insights.push({
        tipo: 'info',
        titulo: `🚀 Pico suspeito: ${usuario}`,
        mensagem: `${maxDesemp.toFixed(1)}% em ${peakDay?.data} (média geral: ${avgDesempenho.toFixed(1)}%)`,
        icone: '🚀',
      });
    }
  }

  return insights;
}

export function calculateRanking(summaries: DaySummary[]): DaySummary[] {
  const byUser: Record<string, DaySummary[]> = {};
  for (const s of summaries) {
    if (!byUser[s.usuario]) byUser[s.usuario] = [];
    byUser[s.usuario].push(s);
  }

  const rankings: DaySummary[] = [];

  for (const [usuario, userSummaries] of Object.entries(byUser)) {
    const totalVolumes = userSummaries.reduce((s, d) => s + d.volumes, 0);
    const totalProdutivo = userSummaries.reduce((s, d) => s + d.tempoProdutivoSeg, 0);
    const totalOcioso = userSummaries.reduce((s, d) => s + d.tempoOciosoSeg, 0);

    const segVol = totalVolumes > 0 ? totalProdutivo / totalVolumes : 0;
    const volHora = totalProdutivo > 0 ? totalVolumes / (totalProdutivo / 3600) : 0;
    const volSeg = totalProdutivo > 0 ? totalVolumes / totalProdutivo : 0;
    const desempenho = segVol > 0 ? (30 / segVol) * 100 : 0;

    rankings.push({
      usuario,
      data: userSummaries.map(s => s.data).join(', '),
      volumes: totalVolumes,
      tempoProdutivoSeg: totalProdutivo,
      tempoOciosoSeg: totalOcioso,
      volHora: Math.round(volHora * 100) / 100,
      segVol: Math.round(segVol * 100) / 100,
      volSeg: Math.round(volSeg * 10000) / 10000,
      desempenho: Math.round(desempenho * 100) / 100,
      intervalos: [],
    });
  }

  return rankings.sort((a, b) => b.desempenho - a.desempenho);
}
