import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { PainelGeral } from './pages/PainelGeral';
import { ModulePage } from './pages/ModulePage';
import { Configuracoes } from './pages/Configuracoes';
import { useStore } from './store';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useRealtimeIdleMonitor } from './hooks/useRealtimeIdleMonitor';

function AppContent() {
  const currentPage = useStore((s) => s.currentPage);

  switch (currentPage) {
    case 'painel': return <PainelGeral />;
    case 'separacao': return <ModulePage module="separacao" />;
    case 'ressuprimento': return <ModulePage module="ressuprimento" />;
    case 'configuracoes': return <Configuracoes />;
    default: return <PainelGeral />;
  }
}

function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { initFirebase } = useFirebaseSync();
  useRealtimeIdleMonitor(); // Checks every 30s for real idle states

 useEffect(() => {
  initFirebase();

  // ativa configurações padrão ao iniciar
  useStore.setState((s) => ({
    settings: {
      ...s.settings,
      soundEnabled: true,
      browserNotifications: true,
      realtimeEnabled: true,
    }
  }));

  // solicita permissão do navegador
  if (
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission();
  }

}, [initFirebase]);

  return <>{children}</>;
}

export default function App() {
  return (
    <FirebaseProvider>
      <Layout>
        <AppContent />
      </Layout>
    </FirebaseProvider>
  );
}
