import { useState, useRef, useEffect } from 'react';
import { useCrmStore } from '../store/useCrmStore';
import { Paperclip, Mic, Send, MoreVertical, Smartphone, FileText, X, Square } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

export function ChatArea() {
    const { leads, messages, selectedLeadId, sendMessage } = useCrmStore();
    const [inputText, setInputText] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputText(text);
        if (text === '/') {
            setShowQuickReplies(true);
        } else {
            setShowQuickReplies(false);
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
                <Smartphone className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4 opacity-50" />
                <h2 className="text-xl text-slate-400 dark:text-slate-600 font-medium">Selecione uma conversa para começar</h2>
            </div>
        );
    }

    return (
        <div className="w-[50vw] h-screen flex flex-col bg-slate-50 dark:bg-slate-900 relative">

            {/* Header */}
            <div className="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4 cursor-pointer">
                    <img
                        src={selectedLead.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLead.name)}`}
                        alt={selectedLead.name}
                        className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"
                    />
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{selectedLead.name}</h2>
                        <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400">Online</span>
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-custom p-6 z-10 space-y-4">
                {leadMessages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const time = format(new Date(msg.created_at), 'HH:mm', { locale: ptBR });

                    return (
                        <div key={msg.id} className={clsx('flex', isOutbound ? 'justify-end' : 'justify-start')}>
                            <div
                                className={clsx(
                                    'max-w-[70%] px-5 py-3 text-[15px] relative',
                                    isOutbound
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-[0_2px_8px_-2px_rgba(79,70,229,0.3)]'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/50'
                                )}
                            >
                                <div className="pb-4 pr-4 leading-relaxed">
                                    {msg.type === 'image' && msg.media_url ? (
                                        <div className="mb-2">
                                            <img src={msg.media_url} alt="Imagem enviada" className="max-w-[250px] max-h-[250px] object-cover rounded-xl shadow-sm border border-black/5" />
                                        </div>
                                    ) : msg.type === 'audio' && msg.media_url ? (
                                        <div className="mb-2">
                                            <audio controls src={msg.media_url} className="h-10 w-60 outline-none rounded-full" />
                                        </div>
                                    ) : msg.type === 'document' && msg.media_url ? (
                                        <div className="mb-2 flex items-center gap-2 p-3 bg-white/20 dark:bg-slate-700/50 rounded-lg">
                                            <FileText className="w-6 h-6 shrink-0" />
                                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-2 break-all line-clamp-1 hover:text-indigo-200">
                                                Visualizar Documento
                                            </a>
                                        </div>
                                    ) : null}
                                    {msg.content && <span>{msg.content}</span>}
                                </div>
                                <div className="absolute right-3 bottom-2 flex items-center gap-1.5">
                                    <span className={clsx("text-[10px] font-medium opacity-80", isOutbound ? "text-indigo-100" : "text-slate-400")}>{time}</span>
                                    {isOutbound && (
                                        <svg viewBox="0 0 16 15" width="14" height="14" className={msg.status === 'read' ? 'text-indigo-200' : 'text-indigo-400/50'}>
                                            {/* Double Check SVG */}
                                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                                    <div className="absolute bottom-full left-0 mb-4 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden shrink-0 z-50">
                                        <div className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">Respostas Rápidas</div>
                                        <ul className="py-1">
                                            <li onClick={() => { setInputText('Olá! Tudo bem? Como posso ajudar?'); setShowQuickReplies(false); }} className="px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors">Saudação Inicial</li>
                                            <li onClick={() => { setInputText('Aguarde um momento, por favor.'); setShowQuickReplies(false); }} className="px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors">Pedir para aguardar</li>
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
