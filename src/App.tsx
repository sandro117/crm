import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ContextPanel } from './components/ContextPanel';
import { KanbanBoard } from './components/KanbanBoard';
import { useCrmStore } from './store/useCrmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './components/Skeleton';

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
      <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="w-[25vw] border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col p-8">
          <Skeleton className="h-10 w-1/3 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-3/4 self-end rounded-2xl rounded-tr-none" />
            <Skeleton className="h-16 w-1/2 rounded-2xl rounded-tl-none" />
            <Skeleton className="h-32 w-2/3 self-end rounded-2xl rounded-tr-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Coluna 1: Lista de Conversas (25%) / Navegação */}
      <Sidebar />

      {/* Condicional de View */}
      <AnimatePresence mode="wait">
        {activeView === 'chat' ? (
          <motion.div
            key="chat-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex"
          >
            {/* Coluna 2: Área de Mensagens (50%) */}
            <div className="flex-1 flex min-w-0">
              <ChatArea />
            </div>

            {/* Coluna 3: Painel de Contexto do CRM (25%) */}
            <ContextPanel />
          </motion.div>
        ) : (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex"
          >
            <KanbanBoard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
