// =====================================================================
// OTAKU NEXUS · js/supabase.js
// ---------------------------------------------------------------------
// Este archivo tiene UNA sola responsabilidad: crear la conexión
// ("cliente") hacia tu proyecto de Supabase y exportarla para que
// auth.js, feed.js, quiz.js y admin.js la importen.
//
// >>> AQUÍ es donde pegas tus llaves de Supabase <<<
//
// 1. Entra a https://supabase.com -> tu proyecto -> Settings -> API
// 2. Copia el valor de "Project URL"          -> pégalo en SUPABASE_URL
// 3. Copia el valor de "anon public" API key  -> pégalo en SUPABASE_ANON_KEY
//
// La "anon key" NO es secreta: está diseñada para usarse en el
// navegador. La seguridad real la dan las políticas RLS que
// configuramos en schema.sql.
// =====================================================================

// Importamos la librería oficial de Supabase directo desde un CDN
// como módulo ES6 (por eso usamos type="module" en los <script> del
// HTML). No necesitas instalar nada con npm para este proyecto.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// -----------------------------------------------------------------
// ⚠️ TUS LLAVES CONFIGURADAS
// -----------------------------------------------------------------
const SUPABASE_URL = 'https://zccbphmebkpuzwbkgtse.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY2JwaG1lYmtwdXp3YmtndHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0Nzk4OTEsImV4cCI6MjA5NzA1NTg5MX0.Pc3VBCZJDsVrn6cx5eelDF6vwrgs3X7uTI5Q1kNgvDY';

// Creamos el cliente una sola vez y lo exportamos. Cualquier otro
// archivo .js de este proyecto hará:
//   import { supabase } from './supabase.js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------------------------------------------
// Helper: obtener la sesión actual (usuario logueado o null)
// -----------------------------------------------------------------
// Lo usan dashboard.html y admin.html para saber si hay alguien
// logueado antes de mostrar contenido protegido.
export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error obteniendo la sesión:', error.message);
    return null;
  }
  return data.session; // null si no hay nadie logueado
}

// -----------------------------------------------------------------
// Helper: obtener el perfil (tabla "usuarios") del usuario logueado
// -----------------------------------------------------------------
export async function obtenerPerfil(userId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error obteniendo el perfil:', error.message);
    return null;
  }
  return data;
}

// -----------------------------------------------------------------
// Helper: cerrar sesión y volver al login
// -----------------------------------------------------------------
export async function cerrarSesion() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
