// =====================================================================
// OTAKU NEXUS · js/admin.js
// ---------------------------------------------------------------------
// Lógica del panel privado (admin.html). Responsabilidades:
//   1. Verificar que quien entra es el administrador (usuarios.es_admin
//      = true). Si no lo es, se muestra una pantalla de "Acceso
//      denegado" y no se carga NADA más.
//   2. CMS de Banners: agregar/eliminar imágenes de fondo para
//      index.html (tabla "configuracion").
//   3. CMS de Videos: agregar/eliminar videos de YouTube del feed
//      (tabla "contenido").
//   4. CMS de Premios: actualizar los 3 premios físicos (tabla
//      "premios").
//
// NOTA SOBRE SEGURIDAD: aunque aquí ocultamos el panel con CSS/JS si
// no eres admin, la seguridad REAL está en las políticas RLS de
// schema.sql ("solo admin escribe"). Aunque alguien intente forzar
// esta página, Supabase rechazará cualquier insert/update/delete que
// no venga de un usuario con es_admin = true.
// =====================================================================

import { supabase, obtenerSesion, obtenerPerfil, cerrarSesion } from './supabase.js';

// ---------------------------------------------------------------------
// REFERENCIAS AL DOM
// ---------------------------------------------------------------------
const pantallaDenegado = document.getElementById('admin-denegado');
const pantallaPanel = document.getElementById('admin-panel-contenedor');
const btnLogout = document.getElementById('btn-logout-admin');

// Tabs
const tabs = document.querySelectorAll('.admin-tab');
const paneles = document.querySelectorAll('.admin-panel');

// Banners
const formBanner = document.getElementById('form-banner');
const listaBanners = document.getElementById('lista-banners');

// Videos
const formVideo = document.getElementById('form-video');
const listaVideos = document.getElementById('lista-videos');

// Premios
const formPremios = document.getElementById('form-premios');

// =====================================================================
// 1) VERIFICACIÓN DE ACCESO
// =====================================================================
(async function verificarAcceso() {
  const sesion = await obtenerSesion();

  if (!sesion) {
    // Nadie logueado -> ni siquiera mostramos "denegado", mandamos al login
    window.location.href = 'index.html';
    return;
  }

  const perfil = await obtenerPerfil(sesion.user.id);

  if (!perfil || perfil.es_admin !== true) {
    // Logueado pero NO es admin -> pantalla de acceso denegado
    pantallaDenegado.classList.remove('oculto');
    pantallaPanel.classList.add('oculto');
    return;
  }

  // Es admin -> mostramos el panel y cargamos todo
  pantallaDenegado.classList.add('oculto');
  pantallaPanel.classList.remove('oculto');

  inicializarTabs();
  cargarBanners();
  cargarVideos();
  cargarPremiosEnFormulario();
})();

btnLogout?.addEventListener('click', cerrarSesion);

// =====================================================================
// 2) TABS (Banners / Videos / Premios)
// =====================================================================
function inicializarTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const objetivo = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove('activo'));
      tab.classList.add('activo');

      paneles.forEach((panel) => {
        panel.classList.toggle('activo', panel.id === `panel-${objetivo}`);
      });
    });
  });
}

// =====================================================================
// 3) CMS DE BANNERS (tabla "configuracion")
// =====================================================================
// Cada banner se guarda como una fila:
//   clave = 'banner_login_<n>', valor = URL de la imagen, orden = n
formBanner?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const url = document.getElementById('banner-url').value.trim();
  if (!url) return;

  const btn = formBanner.querySelector('button[type="submit"]');
  btn.disabled = true;

  // Calculamos el siguiente "orden" como (el mayor orden actual + 1).
  // Usamos el MÁXIMO en vez de la CANTIDAD de filas: así, si se borró
  // un banner intermedio, el siguiente número sigue siendo único y no
  // se repite ninguna "clave" (ej: banner_login_2 dos veces).
  const { data: ultimoBanner } = await supabase
    .from('configuracion')
    .select('orden')
    .like('clave', 'banner_login_%')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const siguienteOrden = (ultimoBanner?.orden || 0) + 1;

  const { error } = await supabase.from('configuracion').insert({
    clave: `banner_login_${siguienteOrden}`,
    valor: url,
    activo: true,
    orden: siguienteOrden,
  });

  btn.disabled = false;

  if (error) {
    alert('Error guardando el banner: ' + error.message);
    return;
  }

  formBanner.reset();
  cargarBanners();
});

async function cargarBanners() {
  if (!listaBanners) return;

  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .like('clave', 'banner_login_%')
    .order('orden', { ascending: true });

  if (error) {
    listaBanners.innerHTML = `<p class="admin-vacio">Error: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaBanners.innerHTML = '<p class="admin-vacio">Todavía no hay banners. Agrega el primero arriba.</p>';
    return;
  }

  listaBanners.innerHTML = '';
  data.forEach((fila) => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <img class="admin-item__miniatura" src="${escapeHTML(fila.valor)}" alt="banner">
      <div class="admin-item__info">
        <div class="admin-item__titulo">${escapeHTML(fila.clave)}</div>
        <div class="admin-item__detalle">${escapeHTML(fila.valor)}</div>
      </div>
      <div class="admin-item__acciones">
        <button class="btn-icono" data-accion="eliminar-banner" data-id="${fila.id}">Eliminar</button>
      </div>
    `;
    listaBanners.appendChild(item);
  });

  // Conectamos los botones de eliminar
  listaBanners.querySelectorAll('[data-accion="eliminar-banner"]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este banner?')) return;
      const { error } = await supabase.from('configuracion').delete().eq('id', boton.dataset.id);
      if (error) {
        alert('Error eliminando: ' + error.message);
        return;
      }
      cargarBanners();
    });
  });
}

// =====================================================================
// 4) CMS DE VIDEOS (tabla "contenido")
// =====================================================================
formVideo?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const titulo = document.getElementById('video-titulo').value.trim();
  const urlOId = document.getElementById('video-url').value.trim();
  const categoria = document.getElementById('video-categoria').value.trim() || 'general';

  const youtubeId = extraerYoutubeId(urlOId);
  if (!youtubeId) {
    alert('No se pudo reconocer el ID de YouTube. Pega el link completo (https://youtube.com/watch?v=... o https://youtu.be/...) o solo el ID de 11 caracteres.');
    return;
  }

  const btn = formVideo.querySelector('button[type="submit"]');
  btn.disabled = true;

  const { error } = await supabase.from('contenido').insert({
    titulo,
    youtube_id: youtubeId,
    categoria,
  });

  btn.disabled = false;

  if (error) {
    alert('Error guardando el video: ' + error.message);
    return;
  }

  formVideo.reset();
  cargarVideos();
});

async function cargarVideos() {
  if (!listaVideos) return;

  const { data, error } = await supabase
    .from('contenido')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    listaVideos.innerHTML = `<p class="admin-vacio">Error: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaVideos.innerHTML = '<p class="admin-vacio">Todavía no hay videos. Agrega el primero arriba.</p>';
    return;
  }

  listaVideos.innerHTML = '';
  data.forEach((video) => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <img class="admin-item__miniatura"
           src="https://i3.ytimg.com/vi/${encodeURIComponent(video.youtube_id)}/hqdefault.jpg"
           alt="thumbnail">
      <div class="admin-item__info">
        <div class="admin-item__titulo">${escapeHTML(video.titulo)}</div>
        <div class="admin-item__detalle">${escapeHTML(video.categoria)} · ${escapeHTML(video.youtube_id)}</div>
      </div>
      <div class="admin-item__acciones">
        <button class="btn-icono" data-accion="eliminar-video" data-id="${video.id}">Eliminar</button>
      </div>
    `;
    listaVideos.appendChild(item);
  });

  listaVideos.querySelectorAll('[data-accion="eliminar-video"]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este video del feed?')) return;
      const { error } = await supabase.from('contenido').delete().eq('id', boton.dataset.id);
      if (error) {
        alert('Error eliminando: ' + error.message);
        return;
      }
      cargarVideos();
    });
  });
}

// Acepta: ID puro (11 caracteres), youtube.com/watch?v=ID, youtu.be/ID,
// youtube.com/shorts/ID y URLs con parámetros extra (&t=, ?si=, etc.)
function extraerYoutubeId(texto) {
  texto = texto.trim();

  // Caso 1: ya es un ID de 11 caracteres (letras, números, _ y -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto;

  try {
    const url = new URL(texto);

    // youtu.be/ID
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').split('/')[0];
    }

    // youtube.com/watch?v=ID
    if (url.searchParams.has('v')) {
      return url.searchParams.get('v');
    }

    // youtube.com/shorts/ID  o  /embed/ID
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes.includes('shorts') || partes.includes('embed')) {
      return partes[partes.length - 1];
    }
  } catch (e) {
    return null;
  }

  return null;
}

// =====================================================================
// 5) CMS DE PREMIOS (tabla "premios", 3 filas fijas)
// =====================================================================
// Cargamos los valores actuales de las 3 filas en los 3 mini-formularios
async function cargarPremiosEnFormulario() {
  if (!formPremios) return;

  const { data, error } = await supabase.from('premios').select('*').order('posicion', { ascending: true });

  if (error) {
    console.error('Error cargando premios:', error.message);
    return;
  }

  data.forEach((premio) => {
    const prefijo = `premio-${premio.posicion}`;
    const inputTitulo = document.getElementById(`${prefijo}-titulo`);
    const inputDescripcion = document.getElementById(`${prefijo}-descripcion`);
    const inputImagen = document.getElementById(`${prefijo}-imagen`);
    const inputVideo = document.getElementById(`${prefijo}-video`);

    if (inputTitulo) inputTitulo.value = premio.titulo || '';
    if (inputDescripcion) inputDescripcion.value = premio.descripcion || '';
    if (inputImagen) inputImagen.value = premio.imagen_url || '';
    if (inputVideo) inputVideo.value = premio.video_url || '';
  });
}

// Guardamos los 3 premios de una sola vez (un UPDATE por cada posición)
formPremios?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const btn = formPremios.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const errores = [];

  for (const posicion of [1, 2, 3]) {
    const prefijo = `premio-${posicion}`;
    const titulo = document.getElementById(`${prefijo}-titulo`).value.trim();
    const descripcion = document.getElementById(`${prefijo}-descripcion`).value.trim();
    const imagen_url = document.getElementById(`${prefijo}-imagen`).value.trim();
    const video_url = document.getElementById(`${prefijo}-video`).value.trim();

    const { error } = await supabase
      .from('premios')
      .update({ titulo, descripcion, imagen_url, video_url, updated_at: new Date().toISOString() })
      .eq('posicion', posicion);

    if (error) errores.push(`Premio ${posicion}: ${error.message}`);
  }

  btn.disabled = false;
  btn.textContent = 'Guardar Premios';

  if (errores.length > 0) {
    alert('Hubo errores:\n' + errores.join('\n'));
  } else {
    alert('¡Premios actualizados! Los usuarios verán los cambios al recargar el dashboard.');
  }
});

// ---------------------------------------------------------------------
// Utilidad: evitar inyección de HTML
// ---------------------------------------------------------------------
function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
