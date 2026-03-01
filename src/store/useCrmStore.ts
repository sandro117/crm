import { create } from 'zustand';
import { supabase } from '../lib/supabase';
export interface FunnelStage { id: string; name: string; order_index: number; }
export interface Tag { id: string; name: string; color: string; }
export interface QuickResponse { id: string; title: string; content: string; shortcut: string; }
export interface Lead {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  company?: string;
  deal_value?: number;
  notes?: string;
  estimated_close_date?: string;
  stage_id: string;
  tags: Tag[];
  last_interaction_at: string;
  avatar?: string;
}
export interface Message { id: string; lead_id: string; direction: 'inbound' | 'outbound'; content: string; status: 'sent' | 'delivered' | 'read'; created_at: string; type?: 'text' | 'image' | 'audio' | 'document'; media_url?: string; }

interface CrmState {
  funnel_stages: FunnelStage[];
  leads: Lead[];
  messages: Message[];
  available_tags: Tag[];
  quick_responses: QuickResponse[];
  selectedLeadId: string | null;
  activeFilter: 'Todos' | 'Abertos' | 'Aguardando' | 'Fechados';
  activeView: 'chat' | 'kanban';

  // Initialization
  isLoading: boolean;
  fetchInitialData: () => Promise<void>;
  subscribeToRealtime: () => void;

  // Actions
  setActiveView: (view: 'chat' | 'kanban') => void;
  selectLead: (id: string) => void;
  setFilter: (filter: 'Todos' | 'Abertos' | 'Aguardando' | 'Fechados') => void;
  sendMessage: (leadId: string, content: string, mediaFile?: File, mediaType?: 'image' | 'audio' | 'document') => Promise<void>;
  changeLeadStage: (leadId: string, newStageId: string) => void; // Apenas local
  updateLeadStage: (leadId: string, newStageId: string) => Promise<void>; // Local + Backend
  updateLeadValue: (leadId: string, newValue: number) => Promise<void>; // Local + Backend
  updateLeadDetails: (leadId: string, details: Partial<Lead>) => void;
  addTag: (leadId: string, tagId: string) => Promise<void>;
  removeTag: (leadId: string, tagId: string) => Promise<void>;
  addQuickResponse: (data: Omit<QuickResponse, 'id'>) => Promise<void>;
  deleteQuickResponse: (id: string) => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  available_tags: [],
  quick_responses: [],
  funnel_stages: [],
  leads: [],
  messages: [],
  selectedLeadId: null,
  activeFilter: 'Todos',
  activeView: 'chat',
  isLoading: true,

  fetchInitialData: async () => {
    set({ isLoading: true });

    try {
      console.log("Iniciando busca no Supabase...");

      const { data: stagesData, error: stagesError } = await supabase.from('funnel_stages').select('*').order('order_index');
      if (stagesError) throw stagesError;
      console.log("Etapas do Funil encontradas:", stagesData);

      const { data: tagsData, error: tagsDataError } = await supabase.from('tags').select('*');
      if (tagsDataError) throw tagsDataError;
      console.log("Tags globais encontradas:", tagsData);

      const { data: leadsData, error: leadsError } = await supabase.from('leads').select('*, lead_tags(tags(id, name, color))');
      if (leadsError) throw leadsError;
      console.log("Leads encontrados:", leadsData);

      const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (messagesError) throw messagesError;
      console.log("Mensagens encontradas:", messagesData);

      // Busca Quick Responses silenciosamente
      const { data: qResponses, error: qrError } = await supabase.from('quick_responses').select('*');
      if (qrError) console.warn("Tabela quick_responses não encontrada ou vazia", qrError);

      const leads = leadsData || [];
      const currentSelected = get().selectedLeadId;
      const initialLeadId = currentSelected || (leads.length > 0 ? leads[0].id : null);

      set({
        available_tags: tagsData || [],
        quick_responses: qResponses || [],
        funnel_stages: stagesData || [],
        leads: leads.map(l => ({
          ...l,
          tags: (l.lead_tags || []).map((lt: any) => lt.tags).filter(Boolean),
          last_interaction_at: l.last_interaction_at || new Date().toISOString()
        })),
        messages: messagesData || [],
        selectedLeadId: initialLeadId,
        isLoading: false
      });
    } catch (error) {
      console.error("ERRO FATAL NO SUPABASE:", error);
      set({ isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    supabase
      .channel('mensagens-ao-vivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Nova mensagem recebida ao vivo!', payload);
          const novaMensagem = payload.new as Message;

          set((state) => {
            // Certifique-se de não duplicar mensagens (optimistic updates)
            if (state.messages.some(m => m.id === novaMensagem.id)) return state;

            return {
              messages: [...state.messages, novaMensagem],
              leads: state.leads.map(lead => lead.id === novaMensagem.lead_id ? { ...lead, last_interaction_at: novaMensagem.created_at } : lead)
            };
          });
        }
      )
      .subscribe();

    supabase
      .channel('leads-ao-vivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('Novo lead recebido ao vivo!', payload);
          const novoLead = payload.new as Lead;
          set((state) => {
            if (state.leads.some(l => l.id === novoLead.id)) return state;
            return { leads: [novoLead, ...state.leads] };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('Lead atualizado ao vivo!', payload);
          const leadAtualizado = payload.new as Lead;
          set((state) => ({
            leads: state.leads.map(lead => lead.id === leadAtualizado.id ? { ...lead, ...leadAtualizado } : lead)
          }));
        }
      )
      .subscribe();
  },

  setActiveView: (view) => set({ activeView: view }),
  selectLead: (id) => set({ selectedLeadId: id }),
  setFilter: (filter) => set({ activeFilter: filter }),

  sendMessage: async (leadId, content, mediaFile, mediaType) => {
    // Busca o lead para pegar o telefone
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead) {
      console.error("Lead não encontrado para envio de mensagem!");
      return;
    }

    let mediaUrl;
    if (mediaFile && mediaType) {
      // Obter extensão se houver, ou usar fallback apropriado
      const fileExt = mediaFile.name ? mediaFile.name.split('.').pop() : (mediaType === 'audio' ? 'webm' : 'bin');
      const fileName = `${leadId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, mediaFile);

      if (uploadError) {
        console.error('Failed to upload media:', uploadError);
        return; // Em caso de erro de upload, cancela o envio
      }

      const { data: publicUrlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
      mediaUrl = publicUrlData.publicUrl;
      console.log('URL Pública Gerada:', mediaUrl);

      if (!mediaUrl) {
        console.error("Erro: Supabase não retornou uma URL válida.");
        return;
      }
    }

    const messageType = mediaType || 'text';

    // Dispara para o webhook do n8n enviar pelo WhatsApp
    const N8N_WEBHOOK_URL = "https://webhook.infometaevo.uk/webhook/hypestore-enviar";
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: lead.phone_number,
        message: content,
        type: messageType,
        media_url: mediaUrl
      })
    }).catch(err => console.error("Erro ao notificar n8n:", err));

    const fallbackId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: fallbackId,
      lead_id: leadId,
      direction: 'outbound',
      content,
      status: 'sent',
      created_at: new Date().toISOString(),
      type: messageType,
      media_url: mediaUrl
    };

    // Optimistic Update
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      leads: state.leads.map(lead => lead.id === leadId ? { ...lead, last_interaction_at: optimisticMessage.created_at } : lead)
    }));

    // Real sending
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        lead_id: leadId,
        direction: 'outbound',
        content,
        status: 'sent',
        type: messageType,
        media_url: mediaUrl
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to insert message:', error);
      // Rollback
      set((state) => ({
        messages: state.messages.filter(m => m.id !== fallbackId)
      }));
    } else {
      // Replace optimistic message
      set((state) => ({
        messages: state.messages.map(m => m.id === fallbackId ? data : m)
      }));
    }
  },

  changeLeadStage: (leadId, newStageId) => {
    set((state) => ({
      leads: state.leads.map(lead => lead.id === leadId ? { ...lead, stage_id: newStageId } : lead)
    }));
  },

  updateLeadStage: async (leadId, newStageId) => {
    // Busca antiga
    const previousLead = get().leads.find(l => l.id === leadId);
    const previousStageId = previousLead?.stage_id;

    // Atualização Otimista
    set((state) => ({
      leads: state.leads.map(lead => lead.id === leadId ? { ...lead, stage_id: newStageId } : lead)
    }));

    // Backend
    const { error } = await supabase
      .from('leads')
      .update({ stage_id: newStageId })
      .eq('id', leadId);

    if (error) {
      console.error('Failed to update lead stage:', error);
      // Rollback em caso de erro
      if (previousStageId) {
        set((state) => ({
          leads: state.leads.map(lead => lead.id === leadId ? { ...lead, stage_id: previousStageId } : lead)
        }));
      }
    }
  },

  updateLeadValue: async (leadId, newValue) => {
    const previousLead = get().leads.find(l => l.id === leadId);
    const previousValue = previousLead?.deal_value;

    // Atualização Otimista
    set((state) => ({
      leads: state.leads.map(lead => lead.id === leadId ? { ...lead, deal_value: newValue } : lead)
    }));

    // Backend
    const { error } = await supabase
      .from('leads')
      .update({ deal_value: newValue })
      .eq('id', leadId);

    if (error) {
      console.error('Failed to update lead deal_value:', error);
      // Rollback
      set((state) => ({
        leads: state.leads.map(lead => lead.id === leadId ? { ...lead, deal_value: previousValue } : lead)
      }));
    }
  },

  updateLeadDetails: (leadId, details) => {
    set((state) => ({
      leads: state.leads.map(lead => lead.id === leadId ? { ...lead, ...details } : lead)
    }));
  },

  addTag: async (leadId, tagId) => {
    const tagToAdd = get().available_tags.find(t => t.id === tagId);
    if (!tagToAdd) return;

    // Otimista
    set((state) => ({
      leads: state.leads.map(lead => {
        if (lead.id === leadId && !lead.tags.some(t => t.id === tagId)) {
          return { ...lead, tags: [...lead.tags, tagToAdd] };
        }
        return lead;
      })
    }));

    // Backend
    const { error } = await supabase.from('lead_tags').insert([{ lead_id: leadId, tag_id: tagId }]);
    if (error) {
      console.error('Erro ao adicionar tag:', error);
      // Rollback
      set((state) => ({
        leads: state.leads.map(lead => {
          if (lead.id === leadId) {
            return { ...lead, tags: lead.tags.filter(t => t.id !== tagId) };
          }
          return lead;
        })
      }));
    }
  },

  removeTag: async (leadId, tagId) => {
    const previousLead = get().leads.find(l => l.id === leadId);
    const removedTag = previousLead?.tags.find(t => t.id === tagId);

    // Otimista
    set((state) => ({
      leads: state.leads.map(lead => {
        if (lead.id === leadId) {
          return { ...lead, tags: lead.tags.filter(t => t.id !== tagId) };
        }
        return lead;
      })
    }));

    // Backend
    const { error } = await supabase.from('lead_tags').delete().match({ lead_id: leadId, tag_id: tagId });
    if (error) {
      console.error('Erro ao remover tag:', error);
      // Rollback
      if (removedTag) {
        set((state) => ({
          leads: state.leads.map(lead => {
            if (lead.id === leadId) {
              return { ...lead, tags: [...lead.tags, removedTag] };
            }
            return lead;
          })
        }));
      }
    }
  },

  addQuickResponse: async (data) => {
    try {
      const { data: newResponse, error } = await supabase.from('quick_responses').insert(data).select().single();
      if (error) throw error;
      set(state => ({ quick_responses: [...state.quick_responses, newResponse] }));
    } catch (err) {
      console.error('Erro ao adicionar quick response:', err);
    }
  },

  deleteQuickResponse: async (id) => {
    try {
      const { error } = await supabase.from('quick_responses').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ quick_responses: state.quick_responses.filter(qr => qr.id !== id) }));
    } catch (err) {
      console.error('Erro ao deletar quick response:', err);
    }
  }
}));
