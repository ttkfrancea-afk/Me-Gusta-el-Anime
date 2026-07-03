// =====================================================================
// OTAKU NEXUS · js/arcade.js
// ---------------------------------------------------------------------
// Pestaña ARCADE: lee la tabla "juegos" y pinta una tarjeta por cada
// uno, enlazando al archivo/URL externo del juego.
// =====================================================================

import { supabase } from './supabase.js';

export async function initArcade() {
  const contenedor = document.getElementById('games-grid');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="feed-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando juegos...</div>';

  const { data, error } = await supabase.from('juegos').select('*').order('id', { ascending: true });

  if (error || !data || data.length === 0) {
    contenedor.innerHTML = '<p class="feed-vacio">Todavía no hay juegos disponibles.</p>';
    return;
  }

  contenedor.innerHTML = '';
  data.forEach((juego) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'game-card';
    tarjeta.innerHTML = `
      <div class="game-card__icon" style="border-color: var(--color-accent-yellow);">
        <i class="${escapeHTML(juego.icono || 'fa-solid fa-gamepad')}" style="color: var(--color-accent-yellow);"></i>
      </div>
      <div class="game-card__info">
        <h3>${escapeHTML(juego.titulo)}</h3>
        <p>${escapeHTML(juego.descripcion || '')}</p>
      </div>
      <i class="fa-solid fa-arrow-up-right-from-square" style="color: var(--color-accent-red);"></i>
    `;
    tarjeta.addEventListener('click', () => { window.location.href = juego.url_archivo; });
    contenedor.appendChild(tarjeta);
  });
}

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
