import React, { useState } from 'react';
import { useCrmStore } from '../store/useCrmStore';
import {
    Phone, Tag, X, Plus, ChevronDown, ChevronRight,
    DollarSign, Calendar, Mail, Briefcase, FileText, Activity, User, Edit2
} from 'lucide-react';
import clsx from 'clsx';
interface AccordionProps {
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function Accordion({ title, icon, isOpen, onToggle, children }: AccordionProps) {
    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50 mb-3 shadow-sm">
            <button
                onClick={onToggle}
                className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="text-indigo-500 dark:text-indigo-400">
                        {icon}
                    </div>
                    <span className="font-bold text-[13px] text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        {title}
                    </span>
                </div>
                <div className={clsx("text-slate-400 transition-transform duration-200", isOpen && "rotate-90")}>
                    <ChevronRight className="w-5 h-5" />
                </div>
            </button>

            {isOpen && (
                <div className="p-5 bg-white dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
                    {children}
                </div>
            )}
        </div>
    );
}

export function ContextPanel() {
    const { leads, funnel_stages, changeLeadStage, updateLeadDetails, addTag, removeTag, selectedLeadId } = useCrmStore();
    const [newTag, setNewTag] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    // Accordion states
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
        funnel: true,
        data: false,
        qualify: true,
        notes: false
    });

    const toggleAccordion = (key: string) => {
        setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const selectedLead = leads.find((l) => l.id === selectedLeadId);

    if (!selectedLead) {
        return (
            <div className="w-[25vw] h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center p-6 text-center z-20 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                <p className="text-slate-500">Selecione um lead para ver os detalhes do CRM.</p>
            </div>
        );
    }

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim()) {
            addTag(selectedLead.id, newTag.trim());
            setNewTag('');
        }
    };

    return (
        <div className="w-[25vw] h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto scrollbar-custom shadow-xl z-20">

            {/* Header Info - Fixed */}
            <div className="p-8 bg-white dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 items-center justify-center flex flex-col pt-10 sticky top-0 z-10 shadow-sm">
                <div className="relative mb-5">
                    <img
                        src={selectedLead.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLead.name)}&size=150`}
                        alt={selectedLead.name}
                        className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-slate-800 bg-slate-100"
                    />
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1.5 text-center leading-tight">
                    {selectedLead.name}
                </h2>

                <div className="flex items-center text-slate-500 font-medium text-sm mb-4 gap-1.5">
                    <Phone className="w-4 h-4" />
                    <span>{selectedLead.phone_number}</span>
                </div>

                <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
                    <Edit2 className="w-3 h-3" />
                    Editar Contato
                </button>
            </div>

            <div className="p-4 space-y-1">

                {/* Accordion 1: Negociação & Funil */}
                <Accordion
                    title="Negociação & Funil"
                    icon={<DollarSign className="w-4 h-4" />}
                    isOpen={openAccordions.funnel}
                    onToggle={() => toggleAccordion('funnel')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Etapa do Funil</label>
                            <div className="relative group">
                                <select
                                    value={selectedLead.stage_id || ""}
                                    onChange={(e) => changeLeadStage(selectedLead.id, e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 focus:border-indigo-500 block px-4 py-2.5 shadow-sm transition-all font-semibold hover:border-indigo-300 dark:hover:border-indigo-600 outline-none cursor-pointer"
                                >
                                    <option value="" disabled hidden>Selecione uma etapa</option>
                                    {funnel_stages.sort((a, b) => a.order_index - b.order_index).map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.order_index} - {stage.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Valor do Negócio</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="R$ 0,00"
                                    value={selectedLead.deal_value || ''}
                                    onChange={(e) => updateLeadDetails(selectedLead.id, { deal_value: parseFloat(e.target.value.replace(/[^0-9.-]+/g, "")) || undefined })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Previsão de Fechamento</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <input
                                    type="date"
                                    value={selectedLead.estimated_close_date || ''}
                                    onChange={(e) => updateLeadDetails(selectedLead.id, { estimated_close_date: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-slate-900 dark:text-slate-100 cursor-text"
                                />
                            </div>
                        </div>
                    </div>
                </Accordion>

                {/* Accordion 2: Dados do Cliente */}
                <Accordion
                    title="Dados do Cliente"
                    icon={<User className="w-4 h-4" />}
                    isOpen={openAccordions.data}
                    onToggle={() => toggleAccordion('data')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">E-mail</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="cliente@empresa.com"
                                    value={selectedLead.email || ''}
                                    onChange={(e) => updateLeadDetails(selectedLead.id, { email: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Empresa</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Nome da Empresa"
                                    value={selectedLead.company || ''}
                                    onChange={(e) => updateLeadDetails(selectedLead.id, { company: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">CPF/CNPJ</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    </div>
                </Accordion>

                {/* Accordion 3: Qualificação & Tags */}
                <Accordion
                    title="Qualificação & Tags"
                    icon={<Tag className="w-4 h-4" />}
                    isOpen={openAccordions.qualify}
                    onToggle={() => toggleAccordion('qualify')}
                >
                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedLead.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/30 shadow-sm transition-all hover:shadow-md">
                                {tag}
                                <button
                                    onClick={() => removeTag(selectedLead.id, tag)}
                                    className="hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-500 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                        {selectedLead.tags.length === 0 && (
                            <span className="text-xs text-slate-400 italic font-medium">Nenhuma tag...</span>
                        )}
                    </div>

                    <form onSubmit={handleAddTag} className="relative flex shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Adicionar tag..."
                            className="w-full bg-white dark:bg-slate-800 border-none px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        />
                        <button
                            type="submit"
                            className="bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 dark:text-slate-400 px-4 py-2.5 transition-colors flex items-center justify-center shrink-0 border-l border-slate-200 dark:border-slate-700"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                </Accordion>

                {/* Accordion 4: Anotações & Histórico */}
                <Accordion
                    title="Anotações & Histórico"
                    icon={<Activity className="w-4 h-4" />}
                    isOpen={openAccordions.notes}
                    onToggle={() => toggleAccordion('notes')}
                >
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Visível apenas para a equipe internamente.</p>
                            <div className="relative shadow-sm rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/50 transition-all focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400">
                                <textarea
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder="Digite anotações privadas deste lead (o cliente não verá)..."
                                    className="w-full h-32 resize-none p-3 bg-transparent text-sm text-amber-900 dark:text-amber-100/90 focus:ring-0 outline-none border-none border-transparent focus:border-transparent placeholder-amber-700/40 dark:placeholder-amber-500/40"
                                ></textarea>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Últimas Atividades</h4>
                            <ul className="space-y-3 relative before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                                <li className="relative pl-6">
                                    <span className="absolute left-0 top-1 w-3.5 h-3.5 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-full z-10"></span>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Nova mensagem recebida</p>
                                    <span className="text-[10px] text-slate-400">Há 5 minutos</span>
                                </li>
                                <li className="relative pl-6">
                                    <span className="absolute left-0 top-1 w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-800 rounded-full z-10"></span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Mudou para a etapa <span className="font-semibold">Em Atendimento</span></p>
                                    <span className="text-[10px] text-slate-400">Ontem às 14:30</span>
                                </li>
                                <li className="relative pl-6">
                                    <span className="absolute left-0 top-1 w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-800 rounded-full z-10"></span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Criado pelo formulário do site</p>
                                    <span className="text-[10px] text-slate-400">Segunda-feira</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Accordion>

            </div>
        </div>
    );
}
