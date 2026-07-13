import { createClient } from '@supabase/supabase-js';

// Usado só para armazenar fotos (quartos, categorias, capa). Auth e banco de
// dados continuam 100% no Firebase — isto substitui apenas o Firebase Storage,
// que passou a exigir plano pago (Blaze) mesmo dentro da faixa gratuita de uso.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export const PHOTOS_BUCKET = 'pousada-photos';
