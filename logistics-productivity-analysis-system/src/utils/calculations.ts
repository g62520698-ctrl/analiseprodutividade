import dayjs from 'dayjs';
import type { ProcessedRecord, SeparatorDaily, KPIData, DetailedAlert } from '../types';

// ─── Constants ───────────────────────────────────────────────────
export const JORNADA_TOTAL_MIN = 525;
export const LIMITE_TAREFA = 20;
export const META_VOL_POR_HORA = 120;
export const META_SEGUNDOS = 30;

const ALM_INI_H = 11, ALM_INI_M = 30;
const ALM_FIM_H = 13, ALM_FIM_M = 0;
const JOR_FIM_H = 17, JOR_FIM_M = 0;

// ─── Helpers ─────────────────────────────────────────────────────
function r2(n: number): number { return Math.round(n * 100) / 100; }

export function formatMinutes(min: number): string {
  if (min < 0) return `-${formatMinutes(-min)}`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function formatMinutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fmtH(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function lunchBounds(dateStr: string) {
  return {
    s: new Date(`${dateStr}T${String(ALM_INI_H).padStart(2, '0')}:${String(ALM_INI_M).padStart(2, '0')}:00`).getTime(),
    e: new Date(`${dateStr}T${String(ALM_FIM_H).padStart(2, '0')}:${String(ALM_FIM_M).padStart(2, '0')}:00`).getTime(),
  };
}

function jornadaFim(dateStr: string) {
  return new Date(`${dateStr}T${String(JOR_FIM_H).padStart(2, '0')}:${String(JOR_FIM_M).padStart(2, '0')}:00`).getTime();
}

// ─── Interval Classification ─────────────────────────────────────
interface Breakdown { produtivo: number; ocioso: number; almoco: number }

function classify(startTs: number, endTs: number, dateStr: string): Breakdown {
  const totalMin = (endTs - startTs) / (1000 * 60);
  if (totalMin <= 0) return { produtivo: 0, ocioso: 0, almoco: 0 };

  const { s: ls, e: le } = lunchBounds(dateStr);

  if (endTs <= ls || startTs >= le) {
    if (totalMin <= LIMITE_TAREFA) return { produtivo: totalMin, ocioso: 0, almoco: 0 };
    return { produtivo: 0, ocioso: totalMin, almoco: 0 };
  }

  const beforeMin = Math.max(0, (ls - startTs) / (1000 * 60));
  const afterMin = Math.max(0, (endTs - le) / (1000 * 60));
  const almocoMin = Math.max(0, (Math.min(endTs, le) - Math.max(startTs, ls)) / (1000 * 60));

  let prod = 0, ocio = 0;
  if (beforeMin > 0) { if (beforeMin <= LIMITE_TAREFA) prod += beforeMin; else ocio += beforeMin; }
  if (afterMin > 0) { if (afterMin <= LIMITE_TAREFA) prod += afterMin; else ocio += afterMin; }

  return { produtivo: prod, ocioso: ocio, almoco: almocoMin };
}

// ─── Ociosidade Final (exclui almoço) ────────────────────────────
function calcOciosidadeFinal(lastTs: number, dateStr: string): number {
  const fim = jornadaFim(dateStr);
  let raw = Math.max(0, (fim - lastTs) / (1000 * 60));
  const { s: ls, e: le } = lunchBounds(dateStr);
  if (lastTs < le && fim > ls) {
    const overlap = Math.max(0, (Math.min(fim, le) - Math.max(lastTs, ls)) / (1000 * 60));
    raw -= overlap;
  }
  return Math.max(0, raw);
}

// ─── Resumos por Separador + Data ────────────────────────────────
export function calcularResumos(records: ProcessedRecord[]): SeparatorDaily[] {
  const groups = new Map<string, ProcessedRecord[]>();
  for (const r of records) {
    const k = `${r.usuario}|||${r.data}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const out: SeparatorDaily[] = [];

  for (const [key, grp] of groups) {
    const [usuario, data] = key.split('|||');
    const sorted = [...grp].sort((a, b) => a.timestamp - b.timestamp);

    // ✅ CORREÇÃO 1: Somar TODOS os volumes de TODAS as linhas
    let totVol = 0;
    for (const rec of sorted) {
      if (rec.volumes > 0) totVol += rec.volumes;
    }

    // Classificar intervalos para tempo produtivo / ocioso
    let tProd = 0, tOcio = 0, tAlm = 0;

    for (let i = 1; i < sorted.length; i++) {
      const anterior = sorted[i - 1];
      const atual = sorted[i];
      const diff = (atual.timestamp - anterior.timestamp) / (1000 * 60);

      if (diff <= 0) continue;

      const bk = classify(anterior.timestamp, atual.timestamp, data);
      tProd += bk.produtivo;
      tOcio += bk.ocioso;
      tAlm += bk.almoco;
    }

    // Ociosidade final (último registro → 17:00, excluindo almoço)
    const lastRec = sorted[sorted.length - 1];
    tOcio += calcOciosidadeFinal(lastRec.timestamp, data);

    const tProdH = tProd / 60;
    const prod = tProdH > 0 ? totVol / tProdH : 0;
    const tMedSeg = totVol > 0 ? (tProd * 60) / totVol : 0;
    const desp = tMedSeg > 0 ? (META_SEGUNDOS / tMedSeg) * 100 : 0;

    out.push({
      usuario, data,
      totalVolumes: totVol,
      tempoProdutivo: r2(tProd),
      tempoOcioso: r2(tOcio),
      tempoAlmoco: r2(tAlm),
      produtividade: r2(prod),
      tempoMedioSeg: r2(tMedSeg),
      desempenho: r2(desp),
      jornadaTotal: JORNADA_TOTAL_MIN,
      registros: sorted.length,
    });
  }

  return out;
}

// ─── KPI Agregado ────────────────────────────────────────────────
export function calcularKPI(resumos: SeparatorDaily[]): KPIData {
  if (resumos.length === 0) {
    return { totalVolumes: 0, totalProdutivo: 0, totalOcioso: 0, produtividade: 0, tempoMedioSeg: 0, desempenho: 0, jornadaTotal: JORNADA_TOTAL_MIN, totalRegistros: 0, separadoresAtivos: 0 };
  }

  const totVol = resumos.reduce((s, r) => s + r.totalVolumes, 0);
  const tProd = resumos.reduce((s, r) => s + r.tempoProdutivo, 0);
  const tOcio = resumos.reduce((s, r) => s + r.tempoOcioso, 0);
  const tProdH = tProd / 60;
  const prod = tProdH > 0 ? totVol / tProdH : 0;
  const tMedSeg = totVol > 0 ? (tProd * 60) / totVol : 0;
  const desp = tMedSeg > 0 ? (META_SEGUNDOS / tMedSeg) * 100 : 0;

  return {
    totalVolumes: totVol,
    totalProdutivo: r2(tProd),
    totalOcioso: r2(tOcio),
    produtividade: r2(prod),
    tempoMedioSeg: r2(tMedSeg),
    desempenho: r2(desp),
    jornadaTotal: JORNADA_TOTAL_MIN,
    totalRegistros: resumos.reduce((s, r) => s + r.registros, 0),
    separadoresAtivos: new Set(resumos.map(r => r.usuario)).size,
  };
}

// ─── Alertas ─────────────────────────────────────────────────────
export function gerarAlertas(records: ProcessedRecord[], resumos: SeparatorDaily[]): DetailedAlert[] {
  const alerts: DetailedAlert[] = [];
  let c = 0;

  const groups = new Map<string, ProcessedRecord[]>();
  for (const r of records) { const k = `${r.usuario}|||${r.data}`; if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(r); }

  for (const [key, grp] of groups) {
    const [usuario, data] = key.split('|||');
    const sorted = [...grp].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sorted.length; i++) {
      const ant = sorted[i - 1], cur = sorted[i];
      const totalMin = (cur.timestamp - ant.timestamp) / (1000 * 60);
      const volumes = ant.volumes;
      if (totalMin <= 0) continue;

      const { s: ls, e: le } = lunchBounds(data);
      const hasLunch = cur.timestamp > ls && ant.timestamp < le;

      if (hasLunch) {
        const befMin = Math.max(0, (ls - ant.timestamp) / (1000 * 60));
        const almMin = Math.max(0, (Math.min(cur.timestamp, le) - Math.max(ant.timestamp, ls)) / (1000 * 60));
        const aftMin = Math.max(0, (cur.timestamp - le) / (1000 * 60));
        const befEnd = fmtH(ls), aftStart = fmtH(le);

        if (befMin > 0) {
          if (befMin <= LIMITE_TAREFA) {
            const tps = volumes > 0 ? (befMin * 60) / volumes : 0;
            alerts.push({ id: `a${c++}`, usuario, data, tipo: 'tarefa', horaInicio: ant.hora, horaFim: befEnd, duracaoMin: r2(befMin), volumes, tempoPorVolSeg: r2(tps), mensagem: `Tarefa: ${formatMinutes(befMin)} | ${volumes} vol | ${tps.toFixed(1)} seg/vol`, severidade: 'info', lido: false });
            if (befMin > 2) alerts.push({ id: `a${c++}`, usuario, data, tipo: 'intervalo', horaInicio: ant.hora, horaFim: befEnd, duracaoMin: r2(befMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Intervalo: ${formatMinutes(befMin)}`, severidade: 'warning', lido: false });
          } else {
            alerts.push({ id: `a${c++}`, usuario, data, tipo: 'ociosidade', horaInicio: ant.hora, horaFim: befEnd, duracaoMin: r2(befMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Ociosidade: ${formatMinutes(befMin)} (${ant.hora} → ${befEnd})`, severidade: 'high', lido: false });
          }
        }
        if (almMin > 0) alerts.push({ id: `a${c++}`, usuario, data, tipo: 'almoco', horaInicio: fmtH(Math.max(ant.timestamp, ls)), horaFim: fmtH(Math.min(cur.timestamp, le)), duracaoMin: r2(almMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Almoço: ${formatMinutes(almMin)}`, severidade: 'info', lido: false });
        if (aftMin > 0) {
          if (aftMin <= LIMITE_TAREFA) {
            const tps = volumes > 0 ? (aftMin * 60) / volumes : 0;
            alerts.push({ id: `a${c++}`, usuario, data, tipo: 'tarefa', horaInicio: aftStart, horaFim: cur.hora, duracaoMin: r2(aftMin), volumes, tempoPorVolSeg: r2(tps), mensagem: `Tarefa: ${formatMinutes(aftMin)} | ${volumes} vol | ${tps.toFixed(1)} seg/vol`, severidade: 'info', lido: false });
            if (aftMin > 2) alerts.push({ id: `a${c++}`, usuario, data, tipo: 'intervalo', horaInicio: aftStart, horaFim: cur.hora, duracaoMin: r2(aftMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Intervalo: ${formatMinutes(aftMin)}`, severidade: 'warning', lido: false });
          } else {
            alerts.push({ id: `a${c++}`, usuario, data, tipo: 'ociosidade', horaInicio: aftStart, horaFim: cur.hora, duracaoMin: r2(aftMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Ociosidade: ${formatMinutes(aftMin)} (${aftStart} → ${cur.hora})`, severidade: 'high', lido: false });
          }
        }
      } else {
        if (totalMin <= LIMITE_TAREFA) {
          const tps = volumes > 0 ? (totalMin * 60) / volumes : 0;
          alerts.push({ id: `a${c++}`, usuario, data, tipo: 'tarefa', horaInicio: ant.hora, horaFim: cur.hora, duracaoMin: r2(totalMin), volumes, tempoPorVolSeg: r2(tps), mensagem: `Tarefa: ${formatMinutes(totalMin)} | ${volumes} vol | ${tps.toFixed(1)} seg/vol`, severidade: 'info', lido: false });
          if (totalMin > 2) alerts.push({ id: `a${c++}`, usuario, data, tipo: 'intervalo', horaInicio: ant.hora, horaFim: cur.hora, duracaoMin: r2(totalMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Intervalo: ${formatMinutes(totalMin)}`, severidade: 'warning', lido: false });
        } else {
          alerts.push({ id: `a${c++}`, usuario, data, tipo: 'ociosidade', horaInicio: ant.hora, horaFim: cur.hora, duracaoMin: r2(totalMin), volumes: 0, tempoPorVolSeg: 0, mensagem: `Ociosidade: ${formatMinutes(totalMin)} (${ant.hora} → ${cur.hora})`, severidade: 'high', lido: false });
        }
      }
    }

    const lastRec = sorted[sorted.length - 1];
    const ocioFinal = calcOciosidadeFinal(lastRec.timestamp, data);
    if (ocioFinal > 0) {
      alerts.push({ id: `a${c++}`, usuario, data, tipo: 'ociosidade_final', horaInicio: lastRec.hora, horaFim: '17:00', duracaoMin: r2(ocioFinal), volumes: 0, tempoPorVolSeg: 0, mensagem: `Ocioso final: ${formatMinutes(ocioFinal)} (${lastRec.hora} → 17:00)`, severidade: ocioFinal > 120 ? 'high' : 'warning', lido: false });
    }
  }

  for (const r of resumos) {
    if (r.produtividade > 0 && r.produtividade < META_VOL_POR_HORA) {
      alerts.push({ id: `a${c++}`, usuario: r.usuario, data: r.data, tipo: 'baixo_desempenho', horaInicio: '', horaFim: '', duracaoMin: 0, volumes: 0, tempoPorVolSeg: r.tempoMedioSeg, mensagem: `Prod: ${r.produtividade.toFixed(1)} vol/h | ${r.tempoMedioSeg.toFixed(1)} seg/vol | Ocioso: ${formatMinutes(r.tempoOcioso)}`, severidade: r.produtividade < META_VOL_POR_HORA * 0.5 ? 'high' : 'warning', lido: false });
    }
  }

  const byDate = new Map<string, SeparatorDaily[]>();
  for (const r of resumos) { if (!byDate.has(r.data)) byDate.set(r.data, []); byDate.get(r.data)!.push(r); }
  const dates = [...byDate.keys()].sort();
  if (dates.length >= 2) {
    const last = byDate.get(dates[dates.length - 1])!, prev = byDate.get(dates[dates.length - 2])!;
    for (const lr of last) {
      const p = prev.find(x => x.usuario === lr.usuario);
      if (p && p.produtividade > 0 && lr.produtividade < p.produtividade * 0.8)
        alerts.push({ id: `a${c++}`, usuario: lr.usuario, data: dates[dates.length - 1], tipo: 'queda', horaInicio: '', horaFim: '', duracaoMin: 0, volumes: 0, tempoPorVolSeg: 0, mensagem: `Queda: ${p.produtividade.toFixed(1)} → ${lr.produtividade.toFixed(1)} vol/h (-${((1 - lr.produtividade / p.produtividade) * 100).toFixed(0)}%)`, severidade: 'warning', lido: false });
    }
  }

  return alerts;
}

// ─── Chart Data ──────────────────────────────────────────────────
export function gerarDadosGraficoProdutividade(resumos: SeparatorDaily[]) {
  const m = new Map<string, { t: number; c: number }>();
  for (const r of resumos) { const e = m.get(r.usuario) || { t: 0, c: 0 }; m.set(r.usuario, { t: e.t + r.produtividade, c: e.c + 1 }); }
  return Array.from(m.entries()).map(([name, { t, c }]) => ({ name, produtividade: r2(t / c), meta: META_VOL_POR_HORA })).sort((a, b) => b.produtividade - a.produtividade);
}

export function gerarDadosGraficoEvolucao(resumos: SeparatorDaily[]) {
  const m = new Map<string, { t: number; c: number; v: number }>();
  for (const r of resumos) { const e = m.get(r.data) || { t: 0, c: 0, v: 0 }; m.set(r.data, { t: e.t + r.produtividade, c: e.c + 1, v: e.v + r.totalVolumes }); }
  return Array.from(m.entries()).map(([d, { t, c, v }]) => ({ date: dayjs(d).format('DD/MM'), produtividade: r2(t / c), volumes: v, meta: META_VOL_POR_HORA })).sort((a, b) => a.date.localeCompare(b.date));
}

export function gerarDadosGraficoTempo(resumos: SeparatorDaily[]) {
  const m = new Map<string, { p: number; o: number }>();
  for (const r of resumos) { const e = m.get(r.usuario) || { p: 0, o: 0 }; m.set(r.usuario, { p: e.p + r.tempoProdutivo, o: e.o + r.tempoOcioso }); }
  return Array.from(m.entries()).map(([name, d]) => ({ name, produtivo: r2(d.p), ocioso: r2(d.o) })).sort((a, b) => b.produtivo - a.produtivo);
}

export function getUniqueUsuarios(records: ProcessedRecord[]): string[] {
  return [...new Set(records.map(r => r.usuario))].sort();
}
