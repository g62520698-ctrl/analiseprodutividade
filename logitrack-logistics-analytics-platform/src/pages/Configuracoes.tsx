import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Save, Users, Settings2, Database, AlertTriangle, Sun, Moon, Volume2, VolumeX, Bell, BellOff, Calculator, Radio, Globe } from 'lucide-react';
import { useStore } from '../store';
import type { Operator } from '../types';
import {
  addOperatorToFirebase, removeOperatorFromFirebase, saveSeparacaoConfig,
  saveRessuprimentoConfig, saveSettings, clearTasksInFirebase,
} from '../services/firebase';

export function Configuracoes() {
  const {
    operators, addOperator, removeOperator, updateOperator,
    separacaoConfig, ressuprimentoConfig,
    updateSeparacaoConfig, updateRessuprimentoConfig,
    clearTasks, addToast, filters, setFilters,
    settings, updateSettings,
  } = useStore();

  const [newName, setNewName] = useState('');
  const [newModule, setNewModule] = useState<'separacao' | 'ressuprimento'>('separacao');
  const [activeSection, setActiveSection] = useState('appearance');

  const [sepConfig, setSepConfig] = useState(separacaoConfig);
  const [resConfig, setResConfig] = useState(ressuprimentoConfig);

  function handleAddOperator() {
    if (!newName.trim()) return;
    const op: Operator = { id: `op-${Date.now()}`, name: newName.trim(), module: newModule };
    addOperator(op);
    addOperatorToFirebase(op).catch(() => {});
    setNewName('');
    addToast(`Operador ${op.name} adicionado com sucesso!`, 'success');
  }

  function handleSaveSepConfig() {
    updateSeparacaoConfig(sepConfig);
    saveSeparacaoConfig(sepConfig).catch(() => {});
    addToast('Configurações de Separação salvas! Sistema recalculado.', 'success');
  }

  function handleSaveResConfig() {
    updateRessuprimentoConfig(resConfig);
    saveRessuprimentoConfig(resConfig).catch(() => {});
    addToast('Configurações de Ressuprimento salvas! Sistema recalculado.', 'success');
  }

  function handleClear(scope: 'separacao' | 'ressuprimento' | 'all') {
    clearTasks(scope);
    clearTasksInFirebase(scope).catch(() => {});
    addToast(`Dados limpos: ${scope === 'all' ? 'Todos' : scope === 'separacao' ? 'Separação' : 'Ressuprimento'}`, 'info');
  }

  const isDark = settings.theme === 'dark';

  const sections = [
    { id: 'appearance', label: 'Aparência', icon: isDark ? <Moon size={16} /> : <Sun size={16} /> },
    { id: 'operators', label: 'Operadores', icon: <Users size={16} /> },
    { id: 'separacao', label: 'Separação', icon: <Settings2 size={16} /> },
    { id: 'ressuprimento', label: 'Ressuprimento', icon: <Settings2 size={16} /> },
    { id: 'calculation', label: 'Cálculo', icon: <Calculator size={16} /> },
    { id: 'data', label: 'Dados', icon: <Database size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Configurações</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Gerencie aparência, operadores, parâmetros e dados</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {/* Appearance */}
        {activeSection === 'appearance' && (
          <div className="glow-card rounded-xl p-5 space-y-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Aparência</h3>

            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon size={20} className="text-neon-purple" /> : <Sun size={20} className="text-neon-amber" />}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Tema</p>
                    <p className="text-xs text-[var(--text-muted)]">{isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { const next = isDark ? 'light' : 'dark'; updateSettings({ theme: next }); saveSettings({ ...settings, theme: next }).catch(() => {}); }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-neon-purple' : 'bg-neon-amber'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isDark ? 'left-0.5' : 'left-7'}`} />
                </button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? <Volume2 size={20} className="text-neon-green" /> : <VolumeX size={20} className="text-[var(--text-muted)]" />}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Sons de Alerta</p>
                    <p className="text-xs text-[var(--text-muted)]">{settings.soundEnabled ? 'Ativado' : 'Desativado'}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${settings.soundEnabled ? 'bg-neon-green' : 'bg-[var(--border-color)]'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.soundEnabled ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.notificationsEnabled ? <Bell size={20} className="text-neon-cyan" /> : <BellOff size={20} className="text-[var(--text-muted)]" />}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Notificações Toast</p>
                    <p className="text-xs text-[var(--text-muted)]">{settings.notificationsEnabled ? 'Ativado' : 'Desativado'}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${settings.notificationsEnabled ? 'bg-neon-cyan' : 'bg-[var(--border-color)]'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.notificationsEnabled ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Browser Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe size={20} className={settings.browserNotifications ? 'text-neon-purple' : 'text-[var(--text-muted)]'} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Push Notifications</p>
                    <p className="text-xs text-[var(--text-muted)]">{settings.browserNotifications ? 'Ativado — navegador e celular' : 'Desativado'}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!settings.browserNotifications) {
                      if ('Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                          updateSettings({ browserNotifications: true });
                          addToast('🔔 Notificações push ativadas!', 'success');
                        } else { addToast('Permissão negada pelo navegador.', 'warning'); }
                      } else { addToast('Navegador não suporta push.', 'warning'); }
                    } else { updateSettings({ browserNotifications: false }); }
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${settings.browserNotifications ? 'bg-neon-purple' : 'bg-[var(--border-color)]'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.browserNotifications ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Real-time Monitoring */}
              <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <div className="flex items-center gap-3">
                  <Radio size={20} className={settings.realtimeEnabled ? 'text-neon-green' : 'text-[var(--text-muted)]'} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Monitoramento em Tempo Real</p>
                    <p className="text-xs text-[var(--text-muted)]">{settings.realtimeEnabled ? 'Ativado — alertas instantâneos' : 'Desativado'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateSettings({ realtimeEnabled: !settings.realtimeEnabled });
                    addToast(!settings.realtimeEnabled ? '📡 Tempo real ativado' : '📡 Tempo real desativado', 'info');
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${settings.realtimeEnabled ? 'bg-neon-green' : 'bg-[var(--border-color)]'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.realtimeEnabled ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operators */}
        {activeSection === 'operators' && (
          <div className="glow-card rounded-xl p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Gerenciar Operadores</h3>
            <div className="flex gap-3 mb-6 flex-wrap">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do operador"
                className="flex-1 min-w-[200px] bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
                onKeyDown={(e) => e.key === 'Enter' && handleAddOperator()}
              />
              <select
                value={newModule}
                onChange={(e) => setNewModule(e.target.value as 'separacao' | 'ressuprimento')}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
              >
                <option value="separacao">Separação</option>
                <option value="ressuprimento">Ressuprimento</option>
              </select>
              <button onClick={handleAddOperator} className="flex items-center gap-2 px-4 py-2.5 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm font-medium hover:bg-neon-cyan/30 transition-colors">
                <UserPlus size={16} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {operators.map((op) => (
                <div key={op.id} className="flex items-center gap-3 bg-[var(--bg-tertiary)] rounded-xl px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    op.module === 'separacao' ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-neon-purple/15 text-neon-purple'
                  }`}>
                    {op.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="flex-1 text-sm text-[var(--text-primary)] font-medium">{op.name}</span>
                  <select
                    value={op.module}
                    onChange={(e) => updateOperator(op.id, { module: e.target.value as 'separacao' | 'ressuprimento' })}
                    className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
                  >
                    <option value="separacao">Separação</option>
                    <option value="ressuprimento">Ressuprimento</option>
                  </select>
                  <button onClick={() => { removeOperator(op.id); removeOperatorFromFirebase(op.id).catch(() => {}); addToast(`Operador ${op.name} removido.`, 'info'); }} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separação Config */}
        {activeSection === 'separacao' && (
          <div className="glow-card rounded-xl p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Parâmetros de Separação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <ConfigInput label="Segundos por Volume" value={sepConfig.segundosPorVolume} onChange={(v) => setSepConfig({ ...sepConfig, segundosPorVolume: Number(v) })} />
              <ConfigInput label="Volumes por Hora" value={sepConfig.volumesPorHora} onChange={(v) => setSepConfig({ ...sepConfig, volumesPorHora: Number(v) })} />
              <ConfigInput label="Limite Atenção (min)" value={sepConfig.limiteAtencao} onChange={(v) => setSepConfig({ ...sepConfig, limiteAtencao: Number(v) })} />
              <ConfigInput label="Limite Ociosidade (min)" value={sepConfig.limiteOciosidade} onChange={(v) => setSepConfig({ ...sepConfig, limiteOciosidade: Number(v) })} />
              <ConfigInput label="Início Expediente" value={sepConfig.inicioExpediente} onChange={(v) => setSepConfig({ ...sepConfig, inicioExpediente: v })} type="time" />
              <ConfigInput label="Fim Expediente" value={sepConfig.fimExpediente} onChange={(v) => setSepConfig({ ...sepConfig, fimExpediente: v })} type="time" />
              <ConfigInput label="Início Almoço" value={sepConfig.inicioAlmoco} onChange={(v) => setSepConfig({ ...sepConfig, inicioAlmoco: v })} type="time" />
              <ConfigInput label="Fim Almoço" value={sepConfig.fimAlmoco} onChange={(v) => setSepConfig({ ...sepConfig, fimAlmoco: v })} type="time" />
            </div>
            <button onClick={handleSaveSepConfig} className="flex items-center gap-2 px-6 py-2.5 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm font-medium hover:bg-neon-cyan/30 transition-colors">
              <Save size={16} /> Salvar e Recalcular
            </button>
          </div>
        )}

        {/* Ressuprimento Config */}
        {activeSection === 'ressuprimento' && (
          <div className="glow-card rounded-xl p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Parâmetros de Ressuprimento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <ConfigInput label="Minutos por Tarefa" value={resConfig.minutosPorTarefa} onChange={(v) => setResConfig({ ...resConfig, minutosPorTarefa: Number(v) })} />
              <ConfigInput label="Tarefas por Hora" value={resConfig.tarefasPorHora} onChange={(v) => setResConfig({ ...resConfig, tarefasPorHora: Number(v) })} />
              <ConfigInput label="Limite Atenção (min)" value={resConfig.limiteAtencao} onChange={(v) => setResConfig({ ...resConfig, limiteAtencao: Number(v) })} />
              <ConfigInput label="Limite Ociosidade (min)" value={resConfig.limiteOciosidade} onChange={(v) => setResConfig({ ...resConfig, limiteOciosidade: Number(v) })} />
              <ConfigInput label="Início Expediente" value={resConfig.inicioExpediente} onChange={(v) => setResConfig({ ...resConfig, inicioExpediente: v })} type="time" />
              <ConfigInput label="Fim Expediente" value={resConfig.fimExpediente} onChange={(v) => setResConfig({ ...resConfig, fimExpediente: v })} type="time" />
              <ConfigInput label="Início Almoço" value={resConfig.inicioAlmoco} onChange={(v) => setResConfig({ ...resConfig, inicioAlmoco: v })} type="time" />
              <ConfigInput label="Fim Almoço" value={resConfig.fimAlmoco} onChange={(v) => setResConfig({ ...resConfig, fimAlmoco: v })} type="time" />
            </div>
            <button onClick={handleSaveResConfig} className="flex items-center gap-2 px-6 py-2.5 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm font-medium hover:bg-neon-cyan/30 transition-colors">
              <Save size={16} /> Salvar e Recalcular
            </button>
          </div>
        )}

        {/* Calculation Mode */}
        {activeSection === 'calculation' && (
          <div className="glow-card rounded-xl p-5 space-y-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Modo de Cálculo</h3>
            <p className="text-sm text-[var(--text-muted)]">Selecione a base para o cálculo de produtividade.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { updateSettings({ calcMode: 'volumes' }); addToast('Modo de cálculo: Volumes', 'success'); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  settings.calcMode === 'volumes'
                    ? 'border-neon-cyan bg-neon-cyan/5'
                    : 'border-[var(--border-color)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">📦 Volumes</div>
                <p className="text-xs text-[var(--text-muted)]">Produtividade baseada em volumes processados por hora</p>
              </button>
              <button
                onClick={() => { updateSettings({ calcMode: 'tarefas' }); addToast('Modo de cálculo: Tarefas', 'success'); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  settings.calcMode === 'tarefas'
                    ? 'border-neon-cyan bg-neon-cyan/5'
                    : 'border-[var(--border-color)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">📋 Tarefas</div>
                <p className="text-xs text-[var(--text-muted)]">Produtividade baseada em tarefas concluídas por hora</p>
              </button>
            </div>
          </div>
        )}

        {/* Data Cleanup */}
        {activeSection === 'data' && (
          <div className="glow-card rounded-xl p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Limpeza de Dados</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filters.operatorId}
                onChange={(e) => setFilters({ operatorId: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
              >
                <option value="">Todos Operadores</option>
                {operators.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
              </select>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ dataInicio: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
              />
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ dataFim: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan"
              />
            </div>
            <div className="space-y-3">
              <button onClick={() => handleClear('separacao')} className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-amber-500/10 hover:text-amber-400 transition-all">
                <AlertTriangle size={16} /> Limpar dados de Separação
              </button>
              <button onClick={() => handleClear('ressuprimento')} className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-amber-500/10 hover:text-amber-400 transition-all">
                <AlertTriangle size={16} /> Limpar dados de Ressuprimento
              </button>
              <button onClick={() => handleClear('all')} className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all">
                <Trash2 size={16} /> Limpar TODOS os dados
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ConfigInput({ label, value, onChange, type = 'number' }: { label: string; value: number | string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-neon-cyan transition-colors"
      />
    </div>
  );
}
