import React, { useState } from 'react';
import { useCrmStore } from '../store/useCrmStore';
import clsx from 'clsx';
import { DollarSign, User } from 'lucide-react';
import { TagBadge } from './TagBadge';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';

export function KanbanBoard() {
    const { funnel_stages, leads, updateLeadStage, updateLeadValue } = useCrmStore();
    const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
    const [editingValueId, setEditingValueId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggingLeadId(leadId);
        e.dataTransfer.setData('leadId', leadId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId && stageId !== 'unassigned') {
            updateLeadStage(leadId, stageId);
        } else if (leadId && stageId === 'unassigned') {
            // Se soltar na entrada, removemos a etapa
            updateLeadStage(leadId, null as unknown as string);
        }
        setDraggingLeadId(null);
    };

    if (funnel_stages.length === 0 && leads.length === 0) {
        return (
            <div className="flex-1 h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">🚀 Funil de Vendas Vazio</h2>
                    <p className="text-slate-500 max-w-sm">
                        Não encontramos etapas configuradas nem leads novos. Cadastre etapas no painel do Supabase com "name" e "order_index" para começar e chame um cliente pelo WhatsApp!
                    </p>
                </div>
            </div>
        );
    }

    const columns = [
        {
            id: 'unassigned',
            name: 'Novos Leads',
            order_index: -1,
        },
        ...[...funnel_stages].sort((a, b) => a.order_index - b.order_index)
    ];

    return (
        <div className="flex-1 h-screen bg-slate-50 dark:bg-slate-950 overflow-x-auto overflow-y-hidden flex gap-6 p-8 scrollbar-custom">
            {columns.map(stage => {
                const stageLeads = stage.id === 'unassigned'
                    ? leads.filter(l => !l.stage_id || funnel_stages.every(s => s.id !== l.stage_id))
                    : leads.filter(l => l.stage_id === stage.id);

                // Ocultar coluna de "Novos Leads" se não houver ninguém nela, para manter limpo
                if (stage.id === 'unassigned' && stageLeads.length === 0) return null;

                const totalValue = stageLeads.reduce((acc, lead) => acc + (lead.deal_value || 0), 0);

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: stage.order_index * 0.05 + 0.1 }}
                        className={clsx(
                            "flex-shrink-0 w-80 h-full flex flex-col rounded-[1.5rem] border overflow-hidden shadow-sm transition-colors",
                            stage.id === 'unassigned'
                                ? "bg-slate-100/40 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800"
                                : "bg-slate-100/60 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id as string)} // Ensure string explicitly
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">
                                    {stage.name}
                                </h3>
                                <div className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {stageLeads.length}
                                </div>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 p-3 overflow-y-auto scrollbar-hide space-y-3">
                            {stageLeads.map((lead, index) => (
                                <motion.div
                                    key={lead.id}
                                    layoutId={lead.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    draggable
                                    onDragStart={((e: any) => handleDragStart(e, lead.id)) as any}
                                    onDragEnd={() => setDraggingLeadId(null)}
                                    className={clsx(
                                        "bg-white dark:bg-slate-950 p-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all group",
                                        draggingLeadId === lead.id && "opacity-60 scale-95 shadow-none"
                                    )}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <Avatar
                                            name={lead.name}
                                            url={lead.avatar}
                                            className="w-10 h-10 text-xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {lead.name}
                                            </h4>
                                            {lead.company ? (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                                    <User className="w-3 h-3" /> {lead.company}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                    Sem empresa
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                        {editingValueId === lead.id ? (
                                            <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                                <DollarSign className="w-3 h-3 text-slate-400" />
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    placeholder="0.00"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            updateLeadValue(lead.id, parseFloat(editValue) || 0);
                                                            setEditingValueId(null);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setEditingValueId(null);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        updateLeadValue(lead.id, parseFloat(editValue) || 0);
                                                        setEditingValueId(null);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingValueId(lead.id);
                                                    setEditValue(lead.deal_value ? lead.deal_value.toString() : '');
                                                }}
                                                className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                            >
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.deal_value || 0)}
                                            </span>
                                        )}
                                        {lead.tags.slice(0, 3).map(tag => (
                                            <TagBadge key={tag.id} tag={tag} showIcon />
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
