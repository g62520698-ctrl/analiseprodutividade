import { useMemo, useState } from 'react';
import { Trophy, ArrowUpDown } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { calcularResumos, formatMinutes, META_VOL_POR_HORA } from '../utils/calculations';
import dayjs from 'dayjs';
import type { SeparatorDaily } from '../types';

type SK = 'produtividade' | 'totalVolumes' | 'tempoProdutivo' | 'tempoOcioso' | 'tempoMedioSeg' | 'desempenho';
type SD = 'asc' | 'desc';

const pCol = (v: number) => v >= META_VOL_POR_HORA ? 'text-emerald-400' : v >= META_VOL_POR_HORA * 0.5 ? 'text-amber-400' : 'text-red-400';
const oCol = (v: number) => v <= 150 ? 'text-emerald-400' : v <= 300 ? 'text-amber-400' : 'text-red-400';

export function Ranking() {
  const records = useStore(s => s.records);
  const [sk, setSK] = useState<SK>('produtividade');
  const [sd, setSD] = useState<SD>('desc');

  const resumos = useMemo(() => calcularResumos(records), [records]);

  const agg = useMemo(() => {
    type Item = Record<SK, number> & { usuario: string; dias: number };
    const m = new Map<string, { usuario: string; totalVolumes: number; tempoProdutivo: number; tempoOcioso: number; tempoMedioSeg: number; produtividade: number; desempenho: number; dias: number }>();
    for (const r of resumos) {
      const e = m.get(r.usuario) || { usuario: r.usuario, totalVolumes: 0, tempoProdutivo: 0, tempoOcioso: 0, tempoMedioSeg: 0, produtividade: 0, desempenho: 0, dias: 0 };
      m.set(r.usuario, { usuario: r.usuario, totalVolumes: e.totalVolumes + r.totalVolumes, tempoProdutivo: e.tempoProdutivo + r.tempoProdutivo, tempoOcioso: e.tempoOcioso + r.tempoOcioso, tempoMedioSeg: 0, produtividade: 0, desempenho: 0, dias: e.dias + 1 });
    }
    return Array.from(m.values()).map(i => {
      const tph = i.tempoProdutivo / 60;
      const prod = tph > 0 ? i.totalVolumes / tph : 0;
      const tms = i.totalVolumes > 0 ? (i.tempoProdutivo * 60) / i.totalVolumes : 0;
      const desp = tms > 0 ? (30 / tms) * 100 : 0;
      return { ...i, produtividade: Math.round(prod * 100) / 100, tempoMedioSeg: Math.round(tms * 100) / 100, desempenho: Math.round(desp * 100) / 100 };
    }).sort((a, b) => { const mul = sd === 'desc' ? -1 : 1; return (a[sk] - b[sk]) * mul; }) as Item[];
  }, [resumos, sk, sd]);

  const maxP = useMemo(() => Math.max(...agg.map(a => a.produtividade), META_VOL_POR_HORA), [agg]);

  const daily = useMemo(() => [...resumos].sort((a, b) => a.usuario !== b.usuario ? a.usuario.localeCompare(b.usuario) : b.data.localeCompare(a.data)), [resumos]);

  const sort = (k: SK) => { if (sk === k) setSD(d => d === 'desc' ? 'asc' : 'desc'); else { setSK(k); setSD('desc'); } };

  const cols: { key: SK; label: string }[] = [
    { key: 'produtividade', label: 'Prod. (vol/h)' },
    { key: 'totalVolumes', label: 'Volumes' },
    { key: 'tempoProdutivo', label: 'Produtivo' },
    { key: 'tempoOcioso', label: 'Ocioso' },
    { key: 'tempoMedioSeg', label: 'Seg/Vol' },
    { key: 'desempenho', label: 'Desemp. (%)' },
  ];

  if (records.length === 0) {
    return <div className="flex flex-col items-center justify-center py-32 text-center">
      <Trophy className="w-16 h-16 text-slate-700 mb-4" />
      <h3 className="text-lg font-semibold text-slate-400 mb-2">Sem dados</h3>
      <p className="text-sm text-slate-500">Importe dados para visualizar o ranking</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* General Ranking */}
      <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Ranking Geral</h3>
          <span className="text-xs text-slate-500">{agg.length} separador(es)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/40">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-400 uppercase w-12">#</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-400 uppercase">Separador</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-400 uppercase min-w-[120px]">Desempenho</th>
                {cols.map(c => <th key={c.key} onClick={() => sort(c.key)} className="text-right px-3 py-3 text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">{c.label} <ArrowUpDown className="w-3 h-3" /></span>
                </th>)}
                <th className="text-center px-3 py-3 text-xs font-medium text-slate-400 uppercase">Dias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {agg.map((item, idx) => (
                <tr key={item.usuario} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-3 py-3"><div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-slate-400/20 text-slate-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-800/40 text-slate-500'}`}>{idx + 1}</div></td>
                  <td className="px-3 py-3 text-white font-medium">{item.usuario}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[100px]">
                        <div className={`h-full rounded-full ${item.desempenho >= 100 ? 'bg-emerald-500' : item.desempenho >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min((item.produtividade / maxP) * 100, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${pCol(item.produtividade)}`}>{item.desempenho.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right"><span className={pCol(item.produtividade)}>{item.produtividade.toFixed(1)}</span></td>
                  <td className="px-3 py-3 text-right text-white font-medium">{item.totalVolumes.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-3 text-right text-emerald-400">{formatMinutes(item.tempoProdutivo)}</td>
                  <td className="px-3 py-3 text-right"><span className={oCol(item.tempoOcioso)}>{formatMinutes(item.tempoOcioso)}</span></td>
                  <td className="px-3 py-3 text-right text-slate-300">{item.tempoMedioSeg.toFixed(1)}s</td>
                  <td className="px-3 py-3 text-right"><span className={pCol(item.produtividade)}>{item.desempenho.toFixed(1)}%</span></td>
                  <td className="px-3 py-3 text-center text-slate-400">{item.dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Detail */}
      {daily.length > 0 && (
        <div className="bg-[#151b2b] rounded-xl border border-slate-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60"><h3 className="text-sm font-semibold text-slate-200">Detalhamento Diário</h3></div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/40 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Separador</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Data</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Volumes</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Produtivo</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Ocioso</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Prod.</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Seg/Vol</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase">Desemp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {daily.map((r: SeparatorDaily) => (
                  <tr key={`${r.usuario}_${r.data}`} className="hover:bg-slate-800/20">
                    <td className="px-3 py-2 text-slate-300">{r.usuario}</td>
                    <td className="px-3 py-2 text-slate-400">{dayjs(r.data).format('DD/MM/YYYY')}</td>
                    <td className="px-3 py-2 text-right text-white font-medium">{r.totalVolumes}</td>
                    <td className="px-3 py-2 text-right text-emerald-400">{formatMinutes(r.tempoProdutivo)}</td>
                    <td className="px-3 py-2 text-right"><span className={oCol(r.tempoOcioso)}>{formatMinutes(r.tempoOcioso)}</span></td>
                    <td className="px-3 py-2 text-right"><span className={pCol(r.produtividade)}>{r.produtividade.toFixed(1)}</span></td>
                    <td className="px-3 py-2 text-right text-slate-300">{r.tempoMedioSeg.toFixed(1)}s</td>
                    <td className="px-3 py-2 text-right"><span className={pCol(r.produtividade)}>{r.desempenho.toFixed(0)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
