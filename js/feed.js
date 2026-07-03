// =====================================================================
// OTAKU NEXUS · js/feed.js
// ---------------------------------------------------------------------
// Pestaña INICIO del dashboard: Premios Físicos + Feed de videos de
// YouTube con filtros por categoría. Se inicializa una sola vez desde
// dashboard.js (initInicio) cuando el usuario entra a la pestaña.
// =====================================================================

import { supabase } from './supabase.js';

const ETIQUETAS_POSICION = {
  1: { medalla: '🥇 1er Lugar', clase: 'premio-card--oro' },
  2: { medalla: '🥈 2do Lugar', clase: 'premio-card--plata' },
  3: { medalla: '🥉 3er Lugar', clase: 'premio-card--bronce' },
};

let videosCache = [];
let categoriaActiva = 'todas';

export function initInicio() {
  cargarPremios();
  cargarFeed();
}

// ---------------------------------------------------------------------
// PREMIOS FÍSICOS
// ---------------------------------------------------------------------
async function cargarPremios() {
  const contenedor = document.getElementById('premios-grid');
  if (!contenedor) return;

  const { data, error } = await supabase.from('premios').select('*').order('posicion', { ascending: true });

  if (error) {
    contenedor.innerHTML = '<p class="feed-vacio">No se pudieron cargar los premios.</p>';
    return;
  }

  contenedor.innerHTML = '';
  (data || []).forEach((premio) => {
    const etiqueta = ETIQUETAS_POSICION[premio.posicion] || { medalla: `Lugar ${premio.posicion}`, clase: '' };
    let mediaHTML = '<div class="premio-card__media"></div>';
    if (premio.video_url) {
      mediaHTML = `<div class="premio-card__media"><video src="${escapeHTML(premio.video_url)}" muted loop autoplay playsinline></video></div>`;
    } else if (premio.imagen_url) {
      mediaHTML = `<div class="premio-card__media"><img src="${escapeHTML(premio.imagen_url)}" alt="${escapeHTML(premio.titulo)}"></div>`;
    }

    const tarjeta = document.createElement('article');
    tarjeta.className = `premio-card ${etiqueta.clase}`;
    tarjeta.innerHTML = `
      <div class="premio-card__medalla">${etiqueta.medalla}</div>
      ${mediaHTML}
      <div class="premio-card__titulo">${escapeHTML(premio.titulo)}</div>
    `;
    contenedor.appendChild(tarjeta);
  });
}

// ---------------------------------------------------------------------
// FEED DE VIDEOS DE YOUTUBE
// ---------------------------------------------------------------------
async function cargarFeed() {
  const contenedorFeed = document.getElementById('feed-grid');
  if (!contenedorFeed) return;

  const { data, error } = await supabase.from('contenido').select('*').order('created_at', { ascending: false });

  if (error) {
    contenedorFeed.innerHTML = '<p class="feed-vacio">No se pudo cargar el feed de videos.</p>';
    return;
  }

  videosCache = data || [];
  construirFiltros();
  renderizarFeed();
}

function construirFiltros() {
  const contenedorFiltros = document.getElementById('feed-filtros');
  if (!contenedorFiltros) return;

  const categorias = ['todas', ...new Set(videosCache.map((v) => v.categoria))];

  contenedorFiltros.innerHTML = '';
  categorias.forEach((categoria) => {
    const boton = document.createElement('button');
    boton.textContent = categoria === 'todas' ? 'Todas' : categoria;
    boton.dataset.categoria = categoria;
    if (categoria === categoriaActiva) boton.classList.add('activo');

    boton.addEventListener('click', () => {
      categoriaActiva = categoria;
      contenedorFiltros.querySelectorAll('button').forEach((b) => b.classList.remove('activo'));
      boton.classList.add('activo');
      renderizarFeed();
    });

    contenedorFiltros.appendChild(boton);
  });
}

function renderizarFeed() {
  const contenedorFeed = document.getElementById('feed-grid');
  if (!contenedorFeed) return;

  const videosFiltrados = categoriaActiva === 'todas' ? videosCache : videosCache.filter((v) => v.categoria === categoriaActiva);

  if (videosFiltrados.length === 0) {
    contenedorFeed.innerHTML = '<p class="feed-vacio">Todavía no hay videos en esta categoría.</p>';
    return;
  }

  contenedorFeed.innerHTML = '';
  videosFiltrados.forEach((video) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'feed-card';
    tarjeta.innerHTML = `
      <div class="feed-card__video">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(video.youtube_id)}"
          title="${escapeHTML(video.titulo)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div class="feed-card__info">
        <div class="feed-card__categoria">${escapeHTML(video.categoria)}</div>
        <div class="feed-card__titulo">${escapeHTML(video.titulo)}</div>
      </div>
    `;
    contenedorFeed.appendChild(tarjeta);
  });
}

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
