import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANTE: Reemplaza con tus credenciales reales
const supabaseUrl = 'https://TU_PROYECTO.supabase.co';
const supabaseKey = 'TU_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
