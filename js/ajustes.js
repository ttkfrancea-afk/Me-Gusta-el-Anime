// =====================================================================
// OTAKU NEXUS · js/ajustes.js
// ---------------------------------------------------------------------
// Pestaña AJUSTES: perfil + accesos + cerrar sesión.
// =====================================================================

import { supabase } from './supabase.js';

export async function initAjustes() {
  const nombreEl = document.getElementById('perfil-nombre');
  const puntosEl = document.getElementById('perfil-puntos');
  const avatarEl = document.getElementById('perfil-avatar');

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
    const nombre = perfil?.username || session.user.email;
    if (nombreEl) nombreEl.textContent = nombre;
    if (puntosEl) puntosEl.textContent = `${perfil?.puntos_totales ?? 0} pts`;
    if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();
  }
  // Si no hay sesión, se quedan los placeholders del HTML ("Invitado").

  document.getElementById('btn-logout-app')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
}
