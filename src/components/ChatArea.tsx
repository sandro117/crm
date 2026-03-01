import { useState, useRef, useEffect } from 'react';
import { useCrmStore } from '../store/useCrmStore';
import { Paperclip, Mic, Send, MoreVertical, Smartphone, FileText, X, Square } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';

export function ChatArea() {
    const { leads, messages, quick_responses, selectedLeadId, sendMessage } = useCrmStore();
    const [inputText, setInputText] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [quickReplyFilter, setQuickReplyFilter] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false); // evolution api typing mockup

    // Media states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

    const selectedLead = leads.find((l) => l.id === selectedLeadId);
    const leadMessages = messages.filter((m) => m.lead_id === selectedLeadId);

    useEffect(() => {
        // Auto scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [leadMessages]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Mocking incoming typing from Evolution API when a lead is selected
    useEffect(() => {
        setIsTyping(false);
        const typingTimeout = setTimeout(() => {
            // Randomly simulate typing for 3 seconds occasionally
            if (Math.random() > 0.5) setIsTyping(true);
        }, 5000);

        const stopTyping = setTimeout(() => {
            setIsTyping(false);
        }, 8000);

        return () => {
            clearTimeout(typingTimeout);
            clearTimeout(stopTyping);
        }
    }, [selectedLeadId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputText(text);
        if (text.startsWith('/')) {
            setShowQuickReplies(true);
            setQuickReplyFilter(text.substring(1).toLowerCase());
        } else {
            setShowQuickReplies(false);
            setQuickReplyFilter('');
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() && !attachment && audioChunks.current.length === 0) return;

        let fileToSend = attachment;
        let typeToSend: 'image' | 'audio' | 'document' | undefined = undefined;
        let contentToSend = inputText.trim();

        if (attachment) {
            typeToSend = attachment.type.startsWith('image/') ? 'image' :
                attachment.type.startsWith('audio/') ? 'audio' : 'document';
            if (!contentToSend) contentToSend = typeToSend === 'image' ? '📸 Imagem' : '📄 Documento';
        }

        await sendMessage(selectedLeadId!, contentToSend, fileToSend || undefined, typeToSend);

        setInputText('');
        setShowQuickReplies(false);
        clearAttachment();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAttachment(file);

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setAttachmentPreview(url);
        } else {
            setAttachmentPreview(null);
        }
    };

    const clearAttachment = () => {
        setAttachment(null);
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
            setAttachmentPreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
                MediaRecorder.isTypeSupported('audio/mpeg') ? 'audio/mpeg' :
                    MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

            mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                if (audioChunks.current.length === 0) return;

                const finalMimeType = mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks.current, { type: finalMimeType });

                if (audioBlob.size === 0) return;

                const fileExt = finalMimeType.split('/')[1] === 'mpeg' ? 'mp3' : finalMimeType.split('/')[1] || 'webm';
                const audioFile = new File([audioBlob], `audio_${Date.now()}.${fileExt}`, { type: finalMimeType });

                await sendMessage(selectedLeadId!, '🎤 Áudio', audioFile, 'audio');

                // Limpar
                audioChunks.current = [];
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Erro ao acessar microfone", error);
            alert("Não foi possível acessar seu microfone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!selectedLead) {
        return (
            <div className="w-[50vw] h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <Smartphone className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4 opacity-50" />
                    <h2 className="text-xl text-slate-400 dark:text-slate-600 font-medium">Selecione uma conversa para começar</h2>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-[50vw] h-screen flex flex-col bg-slate-50 dark:bg-slate-900 relative">

            {/* Header */}
            <div className="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4 cursor-pointer">
                    <Avatar
                        name={selectedLead.name}
                        url={selectedLead.avatar}
                        className="w-10 h-10 shadow-sm"
                    />
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{selectedLead.name}</h2>
                        {isTyping ? (
                            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 animate-pulse flex items-center gap-1">
                                digitando<span className="flex gap-0.5"><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span><span className="animate-bounce delay-300">.</span></span>
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400">Online</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-[0_2px_10px_-3px_rgba(79,70,229,0.3)] active:scale-95">
                        Transferir
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-custom p-6 z-10 space-y-6">
                <AnimatePresence initial={false}>
                    {leadMessages.map((msg, index) => {
                        const isOutbound = msg.direction === 'outbound';
                        const time = format(new Date(msg.created_at), 'HH:mm', { locale: ptBR });

                        // Date Separator Logic
                        const currentDate = new Date(msg.created_at);
                        const previousMsg = index > 0 ? leadMessages[index - 1] : null;
                        const showDateSeparator = !previousMsg || !isSameDay(currentDate, new Date(previousMsg.created_at));

                        return (
                            <div key={msg.id} className="flex flex-col">
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                            {format(currentDate, "d 'de' MMMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    layout
                                    className={clsx('flex', isOutbound ? 'justify-end' : 'justify-start')}
                                >
                                    <div
                                        className={clsx(
                                            'max-w-[75%] px-5 py-3 text-[15px] relative group',
                                            isOutbound
                                                ? 'bg-indigo-600 text-white rounded-3xl rounded-br-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,0.3)]'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl rounded-tl-sm shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50'
                                        )}
                                    >
                                        <div className="pb-4 pr-5 leading-relaxed">
                                            {msg.type === 'image' && msg.media_url ? (
                                                <div className="mb-2 -mx-2 -mt-1 relative overflow-hidden rounded-2xl">
                                                    <img src={msg.media_url} alt="Imagem enviada" className="max-w-[280px] max-h-[300px] object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
                                                </div>
                                            ) : msg.type === 'audio' && msg.media_url ? (
                                                <div className="mb-2">
                                                    <audio controls src={msg.media_url} className="h-10 w-64 outline-none rounded-full" />
                                                </div>
                                            ) : msg.type === 'document' && msg.media_url ? (
                                                <div className="mb-2 flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 rounded-xl hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                                    <div className="p-2 bg-white/20 dark:bg-black/20 rounded-lg">
                                                        <FileText className="w-5 h-5 shrink-0" />
                                                    </div>
                                                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline underline-offset-2 break-all line-clamp-1 hover:text-indigo-200">
                                                        Baixar Documento
                                                    </a>
                                                </div>
                                            ) : null}
                                            {msg.content && <span className="whitespace-pre-wrap word-break">{msg.content}</span>}
                                        </div>
                                        <div className="absolute right-3 bottom-2 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <span className={clsx("text-[10px] font-bold tracking-wide", isOutbound ? "text-indigo-200" : "text-slate-400")}>{time}</span>
                                            {isOutbound && (
                                                <svg viewBox="0 0 16 15" width="14" height="14" className={msg.status === 'read' ? 'text-cyan-300' : 'text-indigo-300'}>
                                                    {/* Double Check SVG */}
                                                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Input Area (Floating Style) */}
            <div className="p-4 bg-transparent z-10 shrink-0">
                {/* Preview Attachment */}
                {attachment && (
                    <div className="mb-2 max-w-4xl mx-auto flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 animate-in slide-in-from-bottom-2">
                        {attachmentPreview ? (
                            <img src={attachmentPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <FileText className="w-6 h-6" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{attachment.name}</p>
                            <p className="text-xs text-slate-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={clearAttachment} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 max-w-4xl mx-auto">
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-red-500 font-medium font-mono">{formatTime(recordingTime)}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse hidden sm:inline">Gravando áudio...</span>
                            </div>
                            <button onClick={stopRecording} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors flex items-center gap-2">
                                <Square className="w-4 h-4" /> Parar e Enviar
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,audio/*,.pdf,.doc,.docx"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shrink-0"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <div className="flex-1 relative flex items-center pr-2">
                                {showQuickReplies && (
                                    <div className="absolute bottom-[calc(100%+12px)] left-0 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl shadow-[0_8px_32px_-4px_rgba(79,70,229,0.2)] overflow-hidden shrink-0 z-50 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="px-4 py-2.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/20">
                                            ⚡ Respostas Rápidas
                                        </div>
                                        <ul className="max-h-64 overflow-y-auto scrollbar-custom p-1.5 space-y-0.5">
                                            {(quick_responses || []).filter(qr => qr.shortcut?.toLowerCase().includes(quickReplyFilter) || qr.title.toLowerCase().includes(quickReplyFilter) || qr.content.toLowerCase().includes(quickReplyFilter)).length > 0 ? (
                                                (quick_responses || []).filter(qr => qr.shortcut?.toLowerCase().includes(quickReplyFilter) || qr.title.toLowerCase().includes(quickReplyFilter) || qr.content.toLowerCase().includes(quickReplyFilter)).map(qr => (
                                                    <li
                                                        key={qr.id}
                                                        onClick={() => { setInputText(qr.content); setShowQuickReplies(false); fileInputRef.current?.focus(); }}
                                                        className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all group flex flex-col gap-0.5"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{qr.title}</div>
                                                            {qr.shortcut && <span className="text-[10px] font-mono bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">/{qr.shortcut}</span>}
                                                        </div>
                                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{qr.content}</div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-6 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xl mb-1">🤔</span>
                                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum atalho encontrado</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Digite uma mensagem... (use '/' para atalhos)"
                                    className="w-full bg-transparent border-none px-3 py-3 text-[15px] focus:ring-0 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                    value={inputText}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {inputText.trim() || attachment ? (
                                <button
                                    onClick={handleSend}
                                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center shrink-0 mb-0.5 mr-0.5"
                                >
                                    <Send className="w-5 h-5 ml-0.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={startRecording}
                                    className="p-3 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 mb-0.5 mr-0.5"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
