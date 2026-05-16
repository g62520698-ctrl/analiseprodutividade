import { useMemo } from 'react';
import { useStore } from '../store';
import { Filters } from '../components/Layout';
import { KPICards, buildKPIData, VolumesByDayChart, PerformanceEvolutionChart, TrendChart, DistributionChart, ComparisonRadar, ComparisonChart, TodayVsYesterdayChart, GaugeChart } from '../components/Charts';
import { Heatmap } from '../components/Heatmap';
import { Ranking } from '../components/Ranking';
import { Insights } from '../components/Insights';
import { filterTasks, calculateOperatorMetrics, getHeatmapData, generateInsights, getTodayStr, getYesterdayStr } from '../utils';

export function PainelGeral() {
  const { separacaoTasks, ressuprimentoTasks, separacaoConfig, ressuprimentoConfig, operators, filters } = useStore();

  const sepFiltered = useMemo(() => filterTasks(separacaoTasks, filters), [separacaoTasks, filters]);
  const resFiltered = useMemo(() => filterTasks(ressuprimentoTasks, filters), [ressuprimentoTasks, filters]);
  const allFiltered = useMemo(() => [...sepFiltered, ...resFiltered], [sepFiltered, resFiltered]);

  // Today/Yesterday for comparison
  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();
  const todayTasks = useMemo(() => allFiltered.filter((t) => t.date === todayStr), [allFiltered, todayStr]);
  const yesterdayTasks = useMemo(() => allFiltered.filter((t) => t.date === yesterdayStr), [allFiltered, yesterdayStr]);

  const sepOps = useMemo(() => operators.filter((o) => o.module === 'separacao'), [operators]);
  const resOps = useMemo(() => operators.filter((o) => o.module === 'ressuprimento'), [operators]);

  const sepMetrics = useMemo(() =>
    sepOps.map((op) => calculateOperatorMetrics(sepFiltered, op.id, separacaoConfig, 'separacao')).filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0),
    [sepFiltered, sepOps, separacaoConfig]
  );
  const resMetrics = useMemo(() =>
    resOps.map((op) => calculateOperatorMetrics(resFiltered, op.id, ressuprimentoConfig, 'ressuprimento')).filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0),
    [resFiltered, resOps, ressuprimentoConfig]
  );
  const allMetrics = useMemo(() => [...sepMetrics, ...resMetrics], [sepMetrics, resMetrics]);

  const yesterdayMetrics = useMemo(() =>
    operators.map((op) => {
      const module = op.module;
      const config = module === 'separacao' ? separacaoConfig : ressuprimentoConfig;
      return calculateOperatorMetrics(yesterdayTasks, op.id, config, module);
    }).filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0),
    [yesterdayTasks, operators, separacaoConfig, ressuprimentoConfig]
  );

  const kpiData = useMemo(() => buildKPIData(allFiltered, allMetrics, yesterdayTasks, yesterdayMetrics), [allFiltered, allMetrics, yesterdayTasks, yesterdayMetrics]);
  const heatmapData = useMemo(() => getHeatmapData(allFiltered), [allFiltered]);
  const insights = useMemo(() => generateInsights(allFiltered, allMetrics, 'separacao'), [allFiltered, allMetrics]);

  const avgPerformance = allMetrics.length > 0 ? allMetrics.reduce((s, m) => s + m.performance, 0) / allMetrics.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Painel Geral</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Visão completa da operação logística</p>
        </div>
        <Filters />
      </div>

      <KPICards data={kpiData} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GaugeChart value={avgPerformance} label="Desempenho Geral" />
        <TodayVsYesterdayChart today={todayTasks} yesterday={yesterdayTasks} />
        <DistributionChart metrics={allMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VolumesByDayChart tasks={allFiltered} />
        <PerformanceEvolutionChart tasks={allFiltered} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart tasks={allFiltered} />
        <ComparisonChart sepMetrics={sepMetrics} resMetrics={resMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComparisonRadar metrics={allMetrics} />
        <Heatmap data={heatmapData} />
      </div>

      <Ranking metrics={allMetrics} />

      <Insights insights={insights} />
    </div>
  );
}
