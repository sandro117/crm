import { useCrmStore } from '../store/useCrmStore';
import { Search, MessageSquare, LayoutDashboard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const filters = ['Todos', 'Abertos', 'Aguardando', 'Fechados'] as const;

export function Sidebar() {
    const { leads, funnel_stages, activeFilter, setFilter, selectedLeadId, selectLead, activeView, setActiveView } = useCrmStore();

    // Simple filter logic for mock data demo
    const filteredLeads = leads.filter((lead) => {
        if (activeFilter === 'Todos') return true;
        if (activeFilter === 'Fechados' && lead.stage_id === '4') return true;
        if (activeFilter === 'Abertos' && lead.stage_id !== '4') return true;
        if (activeFilter === 'Aguardando') return lead.tags.includes('Aguardando');
        return false;
    });

    return (
        <div className="w-[25vw] h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            {/* Header / Search */}
            <div className="p-6 pb-4">
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg">H</div>
                    Hypestore
                </h1>

                {/* View Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 shadow-inner">
                    <button
                        onClick={() => setActiveView('chat')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all",
                            activeView === 'chat'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        )}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveView('kanban')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all",
                            activeView === 'kanban'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Funil
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-slate-800 px-4 py-2 gap-2">
                {filters.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setFilter(filter)}
                        className={clsx(
                            'px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-200',
                            activeFilter === filter
                                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-custom p-3 space-y-1">
                {filteredLeads.map((lead) => {
                    const stage = funnel_stages.find((s) => s.id === lead.stage_id);
                    const isSelected = selectedLeadId === lead.id;

                    return (
                        <div
                            key={lead.id}
                            onClick={() => selectLead(lead.id)}
                            className={clsx(
                                'p-4 cursor-pointer transition-all duration-200 group rounded-xl',
                                isSelected
                                    ? 'bg-white dark:bg-slate-800 shadow-sm border-l-4 border-indigo-600 ring-1 ring-slate-100 dark:ring-slate-700/50'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={lead.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=random`}
                                        alt={lead.name}
                                        className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100 ring-2 ring-white dark:ring-slate-800"
                                    />
                                    {/* Status Indicator */}
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={clsx("text-sm font-bold truncate", isSelected ? "text-indigo-950 dark:text-indigo-50" : "text-slate-900 dark:text-slate-100")}>{lead.name}</h3>
                                        <div className="flex items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 gap-1">
                                            {formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true, locale: ptBR }).replace('aproximadamente ', '')}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">
                                        {/* Truncated message preview for demo, normally from messages store */}
                                        Clique para ver as mensagens...
                                    </p>

                                    <div className="flex gap-2 items-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            {stage?.name || 'Sem Etapa'}
                                        </span>
                                        {lead.tags.slice(0, 1).map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 truncate max-w-[80px]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
