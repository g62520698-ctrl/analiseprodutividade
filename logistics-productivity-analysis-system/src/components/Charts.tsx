import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart,
} from 'recharts';
import { Package, ListChecks, TrendingUp, Target, Clock, AlertTriangle, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { OperatorMetrics, Task } from '../types';

const COLORS = ['#00d4ff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#06b6d4'];
const CLASS_COLORS: Record<string, string> = {
  Excelente: '#10b981', Bom: '#3b82f6', Atenção: '#f59e0b', Crítico: '#ef4444',
};

interface KPIData {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  trendLabel?: string;
}

export function KPICards({ data }: { data: KPIData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {data.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glow-card rounded-xl p-4 relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 ${kpi.color}`} />
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color} bg-opacity-15`}>{kpi.icon}</div>
            {kpi.trend !== undefined && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {kpi.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(kpi.trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            {kpi.suffix && <span className="text-sm text-[var(--text-muted)] ml-1">{kpi.suffix}</span>}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{kpi.label}</div>
          {kpi.trendLabel && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{kpi.trendLabel}</div>}
        </motion.div>
      ))}
    </div>
  );
}

export function buildKPIData(
  tasks: Task[], metrics: OperatorMetrics[],
  yesterdayTasks: Task[], yesterdayMetrics: OperatorMetrics[],
): KPIData[] {
  const totalVolumes = tasks.reduce((s, t) => s + t.volumes, 0);
  const totalTarefas = tasks.reduce((s, t) => s + t.tarefas, 0);
  const avgProductivity = metrics.length > 0 ? metrics.reduce((s, m) => s + m.productivity, 0) / metrics.length : 0;
  const avgPerformance = metrics.length > 0 ? metrics.reduce((s, m) => s + m.performance, 0) / metrics.length : 0;
  const totalProdHours = metrics.reduce((s, m) => s + m.productiveHours, 0);
  const totalIdleHours = metrics.reduce((s, m) => s + m.idleHours, 0);
  const totalAlerts = metrics.reduce((s, m) => s + m.alerts, 0);

  const yVolumes = yesterdayTasks.reduce((s, t) => s + t.volumes, 0);
  const yPerf = yesterdayMetrics.length > 0 ? yesterdayMetrics.reduce((s, m) => s + m.performance, 0) / yesterdayMetrics.length : 0;
  const volTrend = yVolumes > 0 ? ((totalVolumes - yVolumes) / yVolumes) * 100 : 0;
  const perfTrend = yPerf > 0 ? ((avgPerformance - yPerf) / yPerf) * 100 : 0;

  return [
    { label: 'Volumes Totais', value: totalVolumes, icon: <Package size={16} className="text-neon-cyan" />, color: 'bg-neon-cyan', trend: volTrend, trendLabel: 'vs ontem' },
    { label: 'Tarefas Totais', value: totalTarefas, icon: <ListChecks size={16} className="text-neon-purple" />, color: 'bg-neon-purple' },
    { label: 'Produtividade Média', value: avgProductivity.toFixed(1), suffix: '/h', icon: <TrendingUp size={16} className="text-neon-green" />, color: 'bg-neon-green' },
    { label: 'Desempenho Médio', value: avgPerformance.toFixed(1), suffix: '%', icon: <Target size={16} className="text-neon-amber" />, color: 'bg-neon-amber', trend: perfTrend, trendLabel: 'vs ontem' },
    { label: 'Tempo Produtivo', value: totalProdHours.toFixed(1), suffix: 'h', icon: <Clock size={16} className="text-neon-cyan" />, color: 'bg-neon-cyan' },
    { label: 'Tempo Ocioso', value: totalIdleHours.toFixed(1), suffix: 'h', icon: <AlertTriangle size={16} className="text-neon-red" />, color: 'bg-neon-red' },
    { label: 'Alertas', value: totalAlerts, icon: <AlertTriangle size={16} className="text-neon-amber" />, color: 'bg-neon-amber' },
    { label: 'Operadores Ativos', value: metrics.length, icon: <Users size={16} className="text-neon-purple" />, color: 'bg-neon-purple' },
    { label: 'Energia Operacional', value: totalProdHours > 0 ? Math.round((totalProdHours / (totalProdHours + totalIdleHours + 0.01)) * 100) : 0, suffix: '%', icon: <Zap size={16} className="text-neon-green" />, color: 'bg-neon-green' },
  ];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glow-card rounded-xl p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

export function VolumesByDayChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { date: string; volumes: number; tarefas: number }>();
    for (const t of tasks) {
      const existing = map.get(t.date) || { date: t.date, volumes: 0, tarefas: 0 };
      existing.volumes += t.volumes;
      existing.tarefas += t.tarefas;
      map.set(t.date, existing);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, date: d.date.slice(5) }));
  }, [tasks]);

  return (
    <ChartCard title="Volumes por Dia" subtitle="Evolução diária de produção">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="volumes" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Volumes" />
          <Bar dataKey="tarefas" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tarefas" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PerformanceEvolutionChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const t of tasks) {
      const dur = (timeToSec(t.horaFim) - timeToSec(t.horaInicio)) / 3600;
      const perf = dur > 0 ? t.volumes / dur : 0;
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(perf);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({
      date: date.slice(5),
      produtividade: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100,
    }));
  }, [tasks]);

  return (
    <ChartCard title="Evolução de Desempenho" subtitle="Produtividade média diária">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="produtividade" stroke="#00d4ff" strokeWidth={2.5} dot={{ fill: '#00d4ff', r: 4 }} name="Produtividade" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function timeToSec(time: string): number {
  const p = time.split(':');
  return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2] || '0');
}

export function ProductiveVsIdleChart({ metrics }: { metrics: OperatorMetrics[] }) {
  const data = metrics.map((m) => ({
    name: m.operatorName.split(' ')[0],
    produtivo: Math.round(m.productiveHours * 100) / 100,
    ocioso: Math.round(m.idleHours * 100) / 100,
  }));

  return (
    <ChartCard title="Tempo Produtivo vs Ocioso">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="produtivo" fill="#10b981" radius={[0, 4, 4, 0]} name="Produtivo" stackId="a" />
          <Bar dataKey="ocioso" fill="#ef4444" radius={[0, 4, 4, 0]} name="Ocioso" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RankingChart({ metrics }: { metrics: OperatorMetrics[] }) {
  const sorted = [...metrics].sort((a, b) => b.performance - a.performance).slice(0, 10);
  const data = sorted.map((m) => ({
    name: m.operatorName.split(' ')[0],
    desempenho: m.performance,
    fill: CLASS_COLORS[m.classification] || '#00d4ff',
  }));

  return (
    <ChartCard title="Ranking Operacional" subtitle="Top 10 por desempenho">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 150]} />
          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="desempenho" radius={[0, 4, 4, 0]} name="Desempenho %">
            {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TrendChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const t of tasks) {
      if (!map.has(t.date)) map.set(t.date, []);
      const dur = (timeToSec(t.horaFim) - timeToSec(t.horaInicio)) / 3600;
      map.get(t.date)!.push(dur > 0 ? t.volumes / dur : 0);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({
      date: date.slice(5),
      produtividade: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100,
    }));
  }, [tasks]);

  return (
    <ChartCard title="Tendência de Produtividade" subtitle="Evolução ao longo do período">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="produtividade" stroke="#00d4ff" fill="url(#gradProd)" strokeWidth={2} name="Produtividade" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DistributionChart({ metrics }: { metrics: OperatorMetrics[] }) {
  const counts = { Excelente: 0, Bom: 0, 'Atenção': 0, 'Crítico': 0 };
  for (const m of metrics) counts[m.classification]++;
  const data = Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({
    name, value, fill: CLASS_COLORS[name],
  }));

  return (
    <ChartCard title="Distribuição de Classificação">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
            {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ComparisonRadar({ metrics }: { metrics: OperatorMetrics[] }) {
  const top5 = [...metrics].sort((a, b) => b.performance - a.performance).slice(0, 5);
  if (top5.length === 0) return <ChartCard title="Comparativo Operadores"><div className="text-center py-10 text-[var(--text-muted)]">Sem dados</div></ChartCard>;
  const data = [
    { metric: 'Produtividade', ...Object.fromEntries(top5.map((m) => [m.operatorName.split(' ')[0], Math.min(m.productivity, 200)])) },
    { metric: 'Desempenho', ...Object.fromEntries(top5.map((m) => [m.operatorName.split(' ')[0], Math.min(m.performance, 200)])) },
    { metric: 'Volumes', ...Object.fromEntries(top5.map((m) => [m.operatorName.split(' ')[0], Math.min(m.totalVolumes / 10, 200)])) },
    { metric: 'Eficiência', ...Object.fromEntries(top5.map((m) => [m.operatorName.split(' ')[0], m.productiveHours > 0 ? Math.min((m.productiveHours / (m.productiveHours + m.idleHours + 0.01)) * 100, 200) : 0])) },
  ];

  return (
    <ChartCard title="Comparativo Top Operadores">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border-color)" />
          <PolarAngleAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} />
          <PolarRadiusAxis stroke="var(--text-muted)" fontSize={10} />
          {top5.map((m, i) => (
            <Radar key={m.operatorId} name={m.operatorName.split(' ')[0]} dataKey={m.operatorName.split(' ')[0]}
              stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.08} />
          ))}
          <Legend />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ComparisonChart({ sepMetrics, resMetrics }: { sepMetrics: OperatorMetrics[]; resMetrics: OperatorMetrics[] }) {
  const avgSep = sepMetrics.length > 0 ? sepMetrics.reduce((s, m) => s + m.performance, 0) / sepMetrics.length : 0;
  const avgRes = resMetrics.length > 0 ? resMetrics.reduce((s, m) => s + m.performance, 0) / resMetrics.length : 0;
  const data = [
    { module: 'Separação', desempenho: Math.round(avgSep * 10) / 10, volumes: sepMetrics.reduce((s, m) => s + m.totalVolumes, 0) },
    { module: 'Ressuprimento', desempenho: Math.round(avgRes * 10) / 10, volumes: resMetrics.reduce((s, m) => s + m.totalVolumes, 0) },
  ];

  return (
    <ChartCard title="Separação vs Ressuprimento" subtitle="Comparativo de módulos">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="module" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="desempenho" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Desempenho %" />
          <Bar dataKey="volumes" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Volumes" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GaugeChart({ value, label, max = 150 }: { value: number; label: string; max?: number }) {
  const pct = Math.min(value / max, 1);
  const angle = -90 + pct * 180;
  const color = pct >= 0.8 ? '#10b981' : pct >= 0.6 ? '#3b82f6' : pct >= 0.4 ? '#f59e0b' : '#ef4444';

  return (
    <ChartCard title={label}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" width="200" height="120">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${pct * 251.3} 251.3`} />
          <line x1="100" y1="100" x2={100 + 70 * Math.cos((angle * Math.PI) / 180)} y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
            stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill={color} />
          <text x="100" y="90" textAnchor="middle" fill="var(--text-primary)" fontSize="24" fontWeight="bold">{value.toFixed(1)}%</text>
        </svg>
      </div>
    </ChartCard>
  );
}

export function TodayVsYesterdayChart({ today, yesterday }: { today: Task[]; yesterday: Task[] }) {
  const todayData = useMemo(() => {
    const byOp = new Map<string, { name: string; volumes: number }>();
    for (const t of today) {
      const existing = byOp.get(t.operatorId) || { name: t.operatorName.split(' ')[0], volumes: 0 };
      existing.volumes += t.volumes;
      byOp.set(t.operatorId, existing);
    }
    return [...byOp.entries()].map(([id, v]) => ({ id, ...v }));
  }, [today]);

  const yesterdayData = useMemo(() => {
    const byOp = new Map<string, number>();
    for (const t of yesterday) {
      byOp.set(t.operatorId, (byOp.get(t.operatorId) || 0) + t.volumes);
    }
    return byOp;
  }, [yesterday]);

  const data = todayData.map((d) => ({
    name: d.name,
    hoje: d.volumes,
    ontem: yesterdayData.get(d.id) || 0,
  }));

  return (
    <ChartCard title="Hoje vs Ontem" subtitle="Comparativo diário por operador">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="hoje" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Hoje" />
          <Bar dataKey="ontem" fill="#252558" radius={[4, 4, 0, 0]} name="Ontem" opacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
