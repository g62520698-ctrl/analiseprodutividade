import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Trophy, Bell, TrendingUp, Lightbulb, Upload } from 'lucide-react';
import { useStore } from '../store';
import { Filters } from '../components/Layout';
import { KPICards, buildKPIData, VolumesByDayChart, PerformanceEvolutionChart, ProductiveVsIdleChart, RankingChart, TrendChart, DistributionChart, GaugeChart } from '../components/Charts';
import { Heatmap } from '../components/Heatmap';
import { Ranking } from '../components/Ranking';
import { Alerts } from '../components/Alerts';
import { Insights } from '../components/Insights';
import { ImportData } from '../components/ImportData';
import { filterTasks, calculateOperatorMetrics, getHeatmapData, generateAlerts, generateInsights, getYesterdayStr } from '../utils';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
  { id: 'ranking', label: 'Ranking', icon: <Trophy size={16} /> },
  { id: 'alertas', label: 'Alertas', icon: <Bell size={16} /> },
  { id: 'evolucao', label: 'Evolução', icon: <TrendingUp size={16} /> },
  { id: 'insights', label: 'Insights', icon: <Lightbulb size={16} /> },
  { id: 'importar', label: 'Importar', icon: <Upload size={16} /> },
];

export function ModulePage({ module }: { module: 'separacao' | 'ressuprimento' }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    separacaoTasks, ressuprimentoTasks,
    separacaoConfig, ressuprimentoConfig,
    operators, filters,
  } = useStore();

  const isSep = module === 'separacao';
  const tasks = isSep ? separacaoTasks : ressuprimentoTasks;
  const config = isSep ? separacaoConfig : ressuprimentoConfig;
  const moduleLabel = isSep ? 'Separação' : 'Ressuprimento';

  const moduleOps = useMemo(() => operators.filter((o) => o.module === module), [operators, module]);
  const filtered = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  const yesterdayStr = getYesterdayStr();
  const yesterdayTasks = useMemo(() => tasks.filter((t) => t.date === yesterdayStr), [tasks, yesterdayStr]);
  const yesterdayMetrics = useMemo(() =>
    moduleOps.map((op) => calculateOperatorMetrics(yesterdayTasks, op.id, config, module)).filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0),
    [yesterdayTasks, moduleOps, config, module]
  );

  const metrics = useMemo(() =>
    moduleOps.map((op) => calculateOperatorMetrics(filtered, op.id, config, module)).filter((m) => m.totalTarefas > 0 || m.totalVolumes > 0),
    [filtered, moduleOps, config, module]
  );

  const kpiData = useMemo(() => buildKPIData(filtered, metrics, yesterdayTasks, yesterdayMetrics), [filtered, metrics, yesterdayTasks, yesterdayMetrics]);
  const heatmapData = useMemo(() => getHeatmapData(filtered), [filtered]);
  const alerts = useMemo(() => generateAlerts(filtered, config), [filtered, config]);
  const insights = useMemo(() => generateInsights(filtered, metrics, module), [filtered, metrics, module]);

  const avgPerformance = metrics.length > 0 ? metrics.reduce((s, m) => s + m.performance, 0) / metrics.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{moduleLabel}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Módulo de {moduleLabel} — Análise completa</p>
        </div>
        <Filters />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GaugeChart value={avgPerformance} label={`Desempenho ${moduleLabel}`} />
              <VolumesByDayChart tasks={filtered} />
              <DistributionChart metrics={metrics} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RankingChart metrics={metrics} />
              <Heatmap data={heatmapData} />
            </div>
          </div>
        )}
        {activeTab === 'ranking' && <Ranking metrics={metrics} />}
        {activeTab === 'alertas' && <Alerts alerts={alerts} />}
        {activeTab === 'evolucao' && (
          <div className="space-y-4">
            <TrendChart tasks={filtered} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VolumesByDayChart tasks={filtered} />
              <ProductiveVsIdleChart metrics={metrics} />
            </div>
            <PerformanceEvolutionChart tasks={filtered} />
          </div>
        )}
        {activeTab === 'insights' && <Insights insights={insights} />}
        {activeTab === 'importar' && <ImportData module={module} />}
      </motion.div>
    </div>
  );
}
