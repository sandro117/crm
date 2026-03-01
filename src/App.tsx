import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ContextPanel } from './components/ContextPanel';
import { KanbanBoard } from './components/KanbanBoard';
import { useCrmStore } from './store/useCrmStore';

function App() {
  const fetchInitialData = useCrmStore(state => state.fetchInitialData);
  const subscribeToRealtime = useCrmStore(state => state.subscribeToRealtime);
  const isLoading = useCrmStore(state => state.isLoading);
  const activeView = useCrmStore(state => state.activeView);

  useEffect(() => {
    // Acorda o sistema e busca os dados reais
    fetchInitialData();
    // Liga a antena do Realtime
    subscribeToRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-500 font-medium">Carregando CRM...</div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Coluna 1: Lista de Conversas (25%) / Navegação */}
      <Sidebar />

      {/* Condicional de View */}
      {activeView === 'chat' ? (
        <>
          {/* Coluna 2: Área de Mensagens (50%) */}
          <ChatArea />

          {/* Coluna 3: Painel de Contexto do CRM (25%) */}
          <ContextPanel />
        </>
      ) : (
        <KanbanBoard />
      )}
    </div>
  );
}

export default App;
