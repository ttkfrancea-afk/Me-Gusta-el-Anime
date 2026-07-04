// =====================================================================
// ME GUSTA EL ANIME · js/search.js
// ---------------------------------------------------------------------
// Pestaña BUSCAR: búsqueda en vivo sobre la tabla "contenido" (los
// mismos videos/publicaciones del Feed). Coincide con cualquier parte
// del título o de la categoría, sin importar mayúsculas/minúsculas
// (ej. buscar "naruto" encuentra "Naruto Shippuden AMV", categoría
// "Naruto", etc.). Se inicializa una sola vez desde dashboard.js.
// =====================================================================

import { supabase } from './supabase.js';

const RETRASO_DEBOUNCE = 350; // ms: evita disparar una consulta por cada tecla
let temporizadorDebounce = null;
let inputInicializado = false;

export function initBuscar() {
  const input = document.getElementById('search-input');
  if (!input || inputInicializado) return;

  inputInicializado = true;
  pintarEstadoInicial();

  input.addEventListener('input', () => {
    clearTimeout(temporizadorDebounce);
    const termino = input.value.trim();

    if (!termino) {
      pintarEstadoInicial();
      return;
    }

    temporizadorDebounce = setTimeout(() => buscarContenido(termino), RETRASO_DEBOUNCE);
  });
}

// ---------------------------------------------------------------------
// ESTADO INICIAL (antes de escribir nada)
// ---------------------------------------------------------------------
function pintarEstadoInicial() {
  const contenedor = document.getElementById('search-resultados');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="estado-vacio">
      <i class="fa-solid fa-ghost"></i>
      <p>Comienza a escribir para ver resultados</p>
    </div>
  `;
}

// ---------------------------------------------------------------------
// CONSULTA A SUPABASE (título O categoría contienen el término)
// ---------------------------------------------------------------------
async function buscarContenido(termino) {
  const contenedor = document.getElementById('search-resultados');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="feed-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando...</div>';

  const patron = `%${termino}%`;
  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .or(`titulo.ilike.${patron},categoria.ilike.${patron}`)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    contenedor.innerHTML = '<p class="feed-vacio">No se pudo completar la búsqueda.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        <i class="fa-solid fa-magnifying-glass"></i>
        <p>Sin resultados para "${escapeHTML(termino)}"</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '';
  data.forEach((item) => contenedor.appendChild(crearTarjetaResultado(item, termino)));
}

// ---------------------------------------------------------------------
// TARJETA DE RESULTADO (mismo lenguaje visual del feed, acento verde)
// ---------------------------------------------------------------------
function crearTarjetaResultado(video, termino) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'search-card';
  tarjeta.innerHTML = `
    <div class="search-card__video">
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(video.youtube_id)}"
        title="${escapeHTML(video.titulo)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
    <div class="search-card__info">
      <div class="search-card__categoria">${resaltarCoincidencia(video.categoria, termino)}</div>
      <div class="search-card__titulo">${resaltarCoincidencia(video.titulo, termino)}</div>
    </div>
  `;
  return tarjeta;
}

// Envuelve la parte del texto que coincide con el término buscado
// dentro de <span class="search-coincidencia"> para resaltarla.
function resaltarCoincidencia(texto = '', termino = '') {
  const textoSeguro = escapeHTML(texto);
  if (!termino) return textoSeguro;

  const terminoSeguro = escapeHTML(termino).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${terminoSeguro})`, 'ig');
  return textoSeguro.replace(regex, '<span class="search-coincidencia">$1</span>');
}

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
