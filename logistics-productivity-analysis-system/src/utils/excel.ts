import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import type { ProcessedRecord, SeparatorDaily, DetailedAlert } from '../types';
import { formatMinutesToHHMM } from './calculations';

// ✅ CORREÇÃO 2: Data EXATA do Excel, sem timezone bug
function parseExcelDate(value: unknown): string | null {
  if (value == null || value === '') return null;

  // Excel serial number → use dayjs from epoch (no UTC shift)
  if (typeof value === 'number') {
    return dayjs('1899-12-30').add(value, 'day').format('YYYY-MM-DD');
  }

  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD');

  if (typeof value === 'string') {
    const p = dayjs(value);
    if (p.isValid()) return p.format('YYYY-MM-DD');
    for (const f of ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']) {
      const d = dayjs(value, f);
      if (d.isValid()) return d.format('YYYY-MM-DD');
    }
  }

  return null;
}

function parseExcelTime(value: unknown, dateStr: string): { hora: string; timestamp: number } | null {
  if (value == null || value === '') return null;

  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 1440);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { hora, timestamp: new Date(`${dateStr}T${hora}:00`).getTime() };
  }

  if (value instanceof Date) {
    const h = value.getHours(), m = value.getMinutes();
    const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { hora, timestamp: new Date(`${dateStr}T${hora}:00`).getTime() };
  }

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10), m = parseInt(match[2], 10);
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return { hora, timestamp: new Date(`${dateStr}T${hora}:00`).getTime() };
    }
    const p = dayjs(`2000-01-01 ${value.trim()}`);
    if (p.isValid()) {
      const h = p.hour(), m = p.minute();
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return { hora, timestamp: new Date(`${dateStr}T${hora}:00`).getTime() };
    }
  }

  return null;
}

function norm(n: string): string { return n.trim().toUpperCase().replace(/\s+/g, '_'); }

export async function parseExcelFile(file: File): Promise<ProcessedRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        const out: ProcessedRecord[] = [];
        for (const row of json) {
          const nr: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) nr[norm(k)] = v;
          const usuario = String(nr['USUARIO'] ?? '').trim().toUpperCase();
          if (!usuario) continue;
          const dt = parseExcelDate(nr['DATAINI']); if (!dt) continue;
          const tr = parseExcelTime(nr['HORA_INI'], dt); if (!tr) continue;
          const vol = Number(nr['QTD_VOLUMES_PDR_EXP'] ?? 0); if (isNaN(vol) || vol < 0) continue;
          out.push({ id: `${usuario}_${dt}_${tr.hora}_${out.length}`, usuario, data: dt, hora: tr.hora, volumes: vol, timestamp: tr.timestamp });
        }
        out.sort((a, b) => a.data !== b.data ? a.data.localeCompare(b.data) : a.timestamp - b.timestamp);
        resolve(out);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ✅ CORREÇÃO 3: Tempo formatado como HH:MM no Excel
export function exportToExcel(resumos: SeparatorDaily[], _alertas: DetailedAlert[], appName: string): void {
  const wb = XLSX.utils.book_new();

  // ABA 1: RESUMO
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumos.map(r => ({
    'Separador': r.usuario,
    'Data': r.data,
    'Volumes': r.totalVolumes,
    'Registros': r.registros,
    'Tempo Produtivo': formatMinutesToHHMM(r.tempoProdutivo),
    'Tempo Ocioso': formatMinutesToHHMM(r.tempoOcioso),
    'Produtividade (vol/h)': r.produtividade.toFixed(1),
    'Tempo Médio (seg/vol)': r.tempoMedioSeg.toFixed(1),
    'Desempenho (%)': r.desempenho.toFixed(1),
  }))), 'Resumo');

  // ABA 2: RANKING
  const rank = [...resumos].sort((a, b) => b.produtividade - a.produtividade);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rank.map((r, i) => ({
    'Posição': i + 1,
    'Separador': r.usuario,
    'Volumes': r.totalVolumes,
    'Tempo Produtivo': formatMinutesToHHMM(r.tempoProdutivo),
    'Tempo Ocioso': formatMinutesToHHMM(r.tempoOcioso),
    'Produtividade (vol/h)': r.produtividade.toFixed(1),
    'Tempo Médio (seg/vol)': r.tempoMedioSeg.toFixed(1),
    'Desempenho (%)': r.desempenho.toFixed(1),
  }))), 'Ranking');

  XLSX.writeFile(wb, `${appName}_relatorio_${dayjs().format('YYYY-MM-DD')}.xlsx`);
}
