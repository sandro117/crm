import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://occzmjwebielacdgxibh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XdzJzQowfh4dnQVzQ9Uc8Q_yBMXet-k';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: Credenciais do Supabase não encontradas. Verifique seu arquivo .env ou o hardcode.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
