export function formatSecondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatSecondsToHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatSecondsToReadable(seconds: number): string {
  if (seconds <= 0) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

// ============================================================
// 🎨 SISTEMA DE CORES POR DESEMPENHO
// ============================================================
// Regra: desempenho = (30 / segVol) * 100
// Escala: ≥100% Verde | 80-99% Amarelo | 60-79% Laranja | <60% Vermelho

export function getCorDesempenho(segVol: number): string {
  if (segVol <= 0) return '#64748b'; // slate
  const desempenho = (30 / segVol) * 100;
  if (desempenho >= 100) return '#22c55e'; // verde
  if (desempenho >= 80)  return '#eab308'; // amarelo
  if (desempenho >= 60)  return '#f97316'; // laranja
  return '#ef4444'; // vermelho
}

export function getCorDesempenhoDark(segVol: number): string {
  if (segVol <= 0) return '#334155';
  const desempenho = (30 / segVol) * 100;
  if (desempenho >= 100) return '#166534'; // verde escuro
  if (desempenho >= 80)  return '#854d0e'; // amarelo escuro
  if (desempenho >= 60)  return '#9a3412'; // laranja escuro
  return '#991b1b'; // vermelho escuro
}

export function getPerformanceColor(desempenho: number): string {
  if (desempenho >= 100) return 'text-emerald-400';
  if (desempenho >= 80)  return 'text-yellow-400';
  if (desempenho >= 60)  return 'text-orange-400';
  return 'text-red-400';
}

export function getPerformanceBg(desempenho: number): string {
  if (desempenho >= 100) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
  if (desempenho >= 80)  return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
  if (desempenho >= 60)  return 'from-orange-500/20 to-orange-500/5 border-orange-500/30';
  return 'from-red-500/20 to-red-500/5 border-red-500/30';
}

export function getPerformanceStatusText(segVol: number): string {
  if (segVol <= 0) return 'Sem dados';
  const desempenho = (30 / segVol) * 100;
  if (desempenho >= 100) return 'Excelente';
  if (desempenho >= 80)  return 'Atenção';
  if (desempenho >= 60)  return 'Baixo';
  return 'Crítico';
}

export function getPerformanceStatusEmoji(segVol: number): string {
  if (segVol <= 0) return '⬜';
  const desempenho = (30 / segVol) * 100;
  if (desempenho >= 100) return '🟢';
  if (desempenho >= 80)  return '🟡';
  if (desempenho >= 60)  return '🟠';
  return '🔴';
}

// Glow/border highlight for best/worst operators
export function getRowHighlight(desempenho: number, isBest: boolean, isWorst: boolean): string {
  if (isBest && desempenho >= 120)  return 'ring-2 ring-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/20';
  if (isWorst && desempenho < 60)   return 'ring-2 ring-red-400/60 bg-red-500/10 shadow-lg shadow-red-500/20';
  if (isBest)  return 'bg-emerald-500/5';
  if (isWorst) return 'bg-red-500/5';
  return '';
}

export function getAlertBorder(tipo: string): string {
  switch (tipo) {
    case 'ocioso': return 'border-l-red-500 bg-red-500/10';
    case 'aviso': return 'border-l-yellow-500 bg-yellow-500/10';
    default: return 'border-l-blue-500 bg-blue-500/10';
  }
}

export function getInsightBorder(tipo: string): string {
  switch (tipo) {
    case 'danger': return 'border-l-red-500 bg-red-500/10';
    case 'warning': return 'border-l-yellow-500 bg-yellow-500/10';
    case 'success': return 'border-l-emerald-500 bg-emerald-500/10';
    default: return 'border-l-blue-500 bg-blue-500/10';
  }
}

export function getInsightIcon(tipo: string): string {
  switch (tipo) {
    case 'danger': return '🔴';
    case 'warning': return '⚠️';
    case 'success': return '🏆';
    default: return 'ℹ️';
  }
}
