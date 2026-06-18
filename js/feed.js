// =====================================================================
// OTAKU NEXUS · js/feed.js
// ---------------------------------------------------------------------
// Se encarga de DOS cosas en dashboard.html:
//   1. Pintar la sección de "Premios Físicos" (3 tarjetas: oro, plata,
//      bronce) leyendo la tabla "premios".
//   2. Pintar el "feed" de videos de YouTube leyendo la tabla
//      "contenido" y generando un <iframe> embebido por cada video,
//      con filtros por categoría.
//
// Importante: NUNCA guardamos archivos de video en Supabase. Solo
// guardamos el "youtube_id" (los 11 caracteres que aparecen después
// de "v=" en una URL de YouTube) y construimos la URL del embed aquí.
// =====================================================================

import { supabase } from './supabase.js';

const contenedorPremios = document.getElementById('premios-grid');
const contenedorFeed = document.getElementById('feed-grid');
const contenedorFiltros = document.getElementById('feed-filtros');

const ETIQUETAS_POSICION = {
  1: { medalla: '🥇 1er Lugar', clase: 'premio-card--oro' },
  2: { medalla: '🥈 2do Lugar', clase: 'premio-card--plata' },
  3: { medalla: '🥉 3er Lugar', clase: 'premio-card--bronce' },
};

// ---------------------------------------------------------------------
// 1) PREMIOS FÍSICOS
// ---------------------------------------------------------------------
async function cargarPremios() {
  if (!contenedorPremios) return;

  const { data, error } = await supabase
    .from('premios')
    .select('*')
    .order('posicion', { ascending: true });

  if (error) {
    console.error('Error cargando premios:', error.message);
    contenedorPremios.innerHTML = '<p class="feed-vacio">No se pudieron cargar los premios.</p>';
    return;
  }

  contenedorPremios.innerHTML = '';

  data.forEach((premio) => {
    const etiqueta = ETIQUETAS_POSICION[premio.posicion] || { medalla: `Lugar ${premio.posicion}`, clase: '' };

    // Decidimos si mostramos <video> o <img> según qué campo tenga
    // datos. Si ninguno tiene valor, mostramos un marcador vacío.
    let mediaHTML = '<div class="premio-card__media"></div>';
    if (premio.video_url) {
      mediaHTML = `
        <div class="premio-card__media">
          <video src="${escapeHTML(premio.video_url)}" muted loop autoplay playsinline></video>
        </div>`;
    } else if (premio.imagen_url) {
      mediaHTML = `
        <div class="premio-card__media">
          <img src="${escapeHTML(premio.imagen_url)}" alt="${escapeHTML(premio.titulo)}">
        </div>`;
    }

    const tarjeta = document.createElement('article');
    tarjeta.className = `glass premio-card ${etiqueta.clase}`;
    tarjeta.innerHTML = `
      <div class="premio-card__medalla">${etiqueta.medalla}</div>
      ${mediaHTML}
      <div class="premio-card__titulo">${escapeHTML(premio.titulo)}</div>
      <div class="premio-card__descripcion">${escapeHTML(premio.descripcion || '')}</div>
    `;

    contenedorPremios.appendChild(tarjeta);
  });
}

// ---------------------------------------------------------------------
// 2) FEED DE VIDEOS DE YOUTUBE
// ---------------------------------------------------------------------
let videosCache = [];
let categoriaActiva = 'todas';

async function cargarFeed() {
  if (!contenedorFeed) return;

  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando el feed:', error.message);
    contenedorFeed.innerHTML = '<p class="feed-vacio">No se pudo cargar el feed de videos.</p>';
    return;
  }

  videosCache = data || [];
  construirFiltros();
  renderizarFeed();
}

// Crea un botón de filtro por cada categoría distinta que exista en
// "contenido", más un botón "Todas".
function construirFiltros() {
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

// Dibuja las tarjetas de video según la categoría activa
function renderizarFeed() {
  if (!contenedorFeed) return;

  const videosFiltrados =
    categoriaActiva === 'todas'
      ? videosCache
      : videosCache.filter((v) => v.categoria === categoriaActiva);

  if (videosFiltrados.length === 0) {
    contenedorFeed.innerHTML = '<p class="feed-vacio">Todavía no hay videos en esta categoría.</p>';
    return;
  }

  contenedorFeed.innerHTML = '';

  videosFiltrados.forEach((video) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'glass feed-card';
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

// ---------------------------------------------------------------------
// Utilidad: evitar inyección de HTML al imprimir texto que viene de la
// base de datos (buenas prácticas básicas de seguridad en el frontend).
// ---------------------------------------------------------------------
function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ---------------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------------
cargarPremios();
cargarFeed();
