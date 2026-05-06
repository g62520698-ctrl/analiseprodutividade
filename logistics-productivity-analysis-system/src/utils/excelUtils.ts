import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { SeparationRecord, DaySummary } from '../types';

dayjs.extend(customParseFormat);

export function tratarData(dataExcel: unknown): string {
  if (typeof dataExcel === 'number') {
    return dayjs('1899-12-30').add(dataExcel, 'day').format('YYYY-MM-DD');
  }
  if (typeof dataExcel === 'string') {
    const parsed = dayjs(dataExcel, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    const fallback = dayjs(dataExcel);
    if (fallback.isValid()) return fallback.format('YYYY-MM-DD');
  }
  return '';
}

export function tratarHora(horaExcel: unknown): string {
  if (typeof horaExcel === 'number') {
    const totalSeconds = Math.round(horaExcel * 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  const str = String(horaExcel || '').trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;
  }
  return str;
}

export function parseExcelFile(buffer: ArrayBuffer): SeparationRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  const records: SeparationRecord[] = [];

  for (const row of jsonData) {
    const usuario = String(row['USUARIO'] || '').replace(/\s+/g, ' ').trim();
    const data = tratarData(row['DATAINI']);
    const hora = tratarHora(row['HORA_INI']);
    const volumes = Number(row['QTD_VOLUMES_PDR_EXP']) || 0;

    if (!usuario || !data || !hora) continue;

    const datetimeStr = `${data} ${hora}`;
    const dt = dayjs(datetimeStr, 'YYYY-MM-DD HH:mm:ss', true);
    if (!dt.isValid()) continue;

    records.push({
      usuario,
      data,
      hora,
      volumes,
      datetime: dt.toISOString(),
    });
  }

  // Sort by datetime
  records.sort((a, b) => a.datetime.localeCompare(b.datetime));

  return records;
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function exportToExcel(summaries: DaySummary[], rankings: DaySummary[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo
  const resumoData = summaries.map(s => ({
    Separador: s.usuario,
    Data: s.data,
    Volumes: s.volumes,
    'Tempo Produtivo': formatSeconds(s.tempoProdutivoSeg),
    'Tempo Ocioso': formatSeconds(s.tempoOciosoSeg),
    'Vol/h': s.volHora,
    'Seg/vol': s.segVol,
    'Desempenho (%)': s.desempenho,
  }));
  const ws1 = XLSX.utils.json_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');

  // Sheet 2: Ranking
  const rankingData = rankings.map((r, i) => ({
    '#': i + 1,
    Separador: r.usuario,
    Volumes: r.volumes,
    'Tempo Produtivo': formatSeconds(r.tempoProdutivoSeg),
    'Tempo Ocioso': formatSeconds(r.tempoOciosoSeg),
    'Vol/h': r.volHora,
    'Seg/vol': r.segVol,
    'Vol/seg': r.volSeg,
    'Desempenho (%)': r.desempenho,
  }));
  const ws2 = XLSX.utils.json_to_sheet(rankingData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Ranking');

  XLSX.writeFile(wb, `relatorio_produtividade_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`);
}
