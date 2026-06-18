// =====================================================================
// OTAKU NEXUS · js/admin.js
// ---------------------------------------------------------------------
// Lógica del panel privado (admin.html).
// MODIFICACIÓN QUIRÚRGICA: Autenticación local desconectada de Supabase Auth.
// Usa credenciales fijas para un acceso rápido y directo.
// =====================================================================

import { supabase } from './supabase.js';

// ---------------------------------------------------------------------
// 1) CREDENCIALES MAESTRAS FIJAS
// ---------------------------------------------------------------------
const ADMIN_USER_MASTER = 'Kleyberth07';
const ADMIN_PASS_MASTER = 'Kley.1234#';

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
// 2) INYECCIÓN DEL LOGIN DIRECTO (Reemplaza la verificación antigua)
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Aseguramos que el "403 Denegado" antiguo no estorbe
  if(pantallaDenegado) pantallaDenegado.classList.add('oculto');
  
  // Verificamos si la pestaña actual ya fue desbloqueada
  if (sessionStorage.getItem('admin_autenticado') === 'true') {
    mostrarPanelAdmin();
  } else {
    pedirCredencialesAdmin();
  }
});

function pedirCredencialesAdmin() {
  pantallaPanel.classList.add('oculto');

  // Creamos la caja de login con el mismo estilo de tu página
  const modalLogin = document.createElement('div');
  modalLogin.id = 'modal-admin-login';
  modalLogin.style.cssText = `
    position: fixed; inset: 0; background: var(--color-bg); 
    display: flex; align-items: center; justify-content: center; z-index: 9999;
    padding: 20px;
  `;

  modalLogin.innerHTML = `
    <div class="glass" style="padding: 2.5rem; width: 100%; max-width: 400px; text-align: center;">
      <h2 style="font-family: var(--font-display); font-size: var(--fs-2xl); letter-spacing: 0.1em; margin-bottom: 1.5rem;">ACCESO <span style="color:var(--color-accent-red);">ADMIN</span></h2>
      <div id="error-admin-login" style="color: var(--color-accent-red); margin-bottom: 1rem; font-weight: 600; display: none; font-size: var(--fs-sm);"></div>
      
      <div style="text-align: left; margin-bottom: 1.2rem;">
        <label style="display:block; margin-bottom:0.4rem; color:var(--color-text-muted); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:0.08em;">Usuario</label>
        <input type="text" id="input-admin-user" style="width:100%; padding:0.8rem; background:rgba(0,0,0,0.35); border:1px solid var(--glass-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:var(--fs-base); outline:none;" placeholder="Tu usuario maestro" />
      </div>

      <div style="text-align: left; margin-bottom: 1.5rem;">
        <label style="display:block; margin-bottom:0.4rem; color:var(--color-text-muted); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:0.08em;">Contraseña</label>
        <input type="password" id="input-admin-pass" style="width:100%; padding:0.8rem; background:rgba(0,0,0,0.35); border:1px solid var(--glass-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:var(--fs-base); outline:none;" placeholder="••••••••" />
      </div>

      <button id="btn-entrar-admin" class="btn btn-primario" style="width:100%; padding:0.9rem;">ENTRAR AL PANEL</button>
    </div>
  `;

  document.body.appendChild(modalLogin);

  document.getElementById('btn-entrar-admin').addEventListener('click', procesarLoginAdmin);
  document.getElementById('input-admin-pass').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') procesarLoginAdmin();
  });
}

function procesarLoginAdmin() {
  const userTxt = document.getElementById('input-admin-user').value.trim();
  const passTxt = document.getElementById('input-admin-pass').value;
  const errorDiv = document.getElementById('error-admin-login');

  if (userTxt === ADMIN_USER_MASTER && passTxt === ADMIN_PASS_MASTER) {
    sessionStorage.setItem('admin_autenticado', 'true');
    document.getElementById('modal-admin-login').remove();
    mostrarPanelAdmin();
  } else {
    errorDiv.textContent = 'Usuario o contraseña incorrectos.';
    errorDiv.style.display = 'block';
  }
}

function mostrarPanelAdmin() {
  pantallaPanel.classList.remove('oculto');
  inicializarTabs();
  cargarBanners();
  cargarVideos();
  cargarPremiosEnFormulario();
}

btnLogout?.addEventListener('click', () => {
  sessionStorage.removeItem('admin_autenticado');
  window.location.reload();
});

// =====================================================================
// 3) TABS (Banners / Videos / Premios)
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
// 4) CMS DE BANNERS (tabla "configuracion")
// =====================================================================
formBanner?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const url = document.getElementById('banner-url').value.trim();
  if (!url) return;

  const btn = formBanner.querySelector('button[type="submit"]');
  btn.disabled = true;

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
  if (error) { alert('Error guardando el banner: ' + error.message); return; }
  formBanner.reset();
  cargarBanners();
});

async function cargarBanners() {
  if (!listaBanners) return;
  const { data, error } = await supabase.from('configuracion').select('*').like('clave', 'banner_login_%').order('orden', { ascending: true });

  if (error) { listaBanners.innerHTML = `<p class="admin-vacio">Error: ${error.message}</p>`; return; }
  if (!data || data.length === 0) { listaBanners.innerHTML = '<p class="admin-vacio">Todavía no hay banners. Agrega el primero arriba.</p>'; return; }

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

  listaBanners.querySelectorAll('[data-accion="eliminar-banner"]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este banner?')) return;
      const { error } = await supabase.from('configuracion').delete().eq('id', boton.dataset.id);
      if (error) { alert('Error eliminando: ' + error.message); return; }
      cargarBanners();
    });
  });
}

// =====================================================================
// 5) CMS DE VIDEOS (tabla "contenido")
// =====================================================================
formVideo?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const titulo = document.getElementById('video-titulo').value.trim();
  const urlOId = document.getElementById('video-url').value.trim();
  const categoria = document.getElementById('video-categoria').value.trim() || 'general';

  const youtubeId = extraerYoutubeId(urlOId);
  if (!youtubeId) {
    alert('No se pudo reconocer el ID de YouTube. Pega el link completo o solo el ID.'); return;
  }

  const btn = formVideo.querySelector('button[type="submit"]');
  btn.disabled = true;

  const { error } = await supabase.from('contenido').insert({ titulo, youtube_id: youtubeId, categoria });

  btn.disabled = false;
  if (error) { alert('Error guardando el video: ' + error.message); return; }
  formVideo.reset();
  cargarVideos();
});

async function cargarVideos() {
  if (!listaVideos) return;
  const { data, error } = await supabase.from('contenido').select('*').order('created_at', { ascending: false });

  if (error) { listaVideos.innerHTML = `<p class="admin-vacio">Error: ${error.message}</p>`; return; }
  if (!data || data.length === 0) { listaVideos.innerHTML = '<p class="admin-vacio">Todavía no hay videos. Agrega el primero arriba.</p>'; return; }

  listaVideos.innerHTML = '';
  data.forEach((video) => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <img class="admin-item__miniatura" src="https://i3.ytimg.com/vi/${encodeURIComponent(video.youtube_id)}/hqdefault.jpg" alt="thumbnail">
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
      if (error) { alert('Error eliminando: ' + error.message); return; }
      cargarVideos();
    });
  });
}

function extraerYoutubeId(texto) {
  texto = texto.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto;
  try {
    const url = new URL(texto);
    if (url.hostname.includes('youtu.be')) return url.pathname.replace('/', '').split('/')[0];
    if (url.searchParams.has('v')) return url.searchParams.get('v');
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes.includes('shorts') || partes.includes('embed')) return partes[partes.length - 1];
  } catch (e) { return null; }
  return null;
}

// =====================================================================
// 6) CMS DE PREMIOS (tabla "premios", 3 filas fijas)
// =====================================================================
async function cargarPremiosEnFormulario() {
  if (!formPremios) return;
  const { data, error } = await supabase.from('premios').select('*').order('posicion', { ascending: true });
  if (error) return;

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

  if (errores.length > 0) alert('Hubo errores:\n' + errores.join('\n'));
  else alert('¡Premios actualizados! Los usuarios verán los cambios al recargar el dashboard.');
});

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
