// =====================================================================
// ME GUSTA EL ANIME · js/ajustes.js
// ---------------------------------------------------------------------
// Pestaña AJUSTES: tarjeta de perfil + 4 acciones (cambiar contraseña,
// información de perfil, cambiar foto, cambiar información) + cerrar
// sesión. Cada acción abre un modal ligero reutilizando .modal-overlay
// / .modal-card (ver dashboard.css), que ya hereda el azul de esta
// sección a través de --color-activo.
// =====================================================================

import { supabase } from './supabase.js';

let sesionActual = null;
let perfilActual = null;

export async function initAjustes() {
  await cargarPerfil();
  enlazarBotones();
}

// ---------------------------------------------------------------------
// CARGA DE LA TARJETA DE PERFIL
// ---------------------------------------------------------------------
async function cargarPerfil() {
  const nombreEl = document.getElementById('perfil-nombre');
  const puntosEl = document.getElementById('perfil-puntos');
  const avatarEl = document.getElementById('perfil-avatar');

  const { data: { session } } = await supabase.auth.getSession();
  sesionActual = session;
  if (!session) return; // se quedan los placeholders del HTML ("Invitado")

  const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
  perfilActual = perfil;

  const nombre = perfil?.username || session.user.email;
  if (nombreEl) nombreEl.textContent = nombre;
  if (puntosEl) puntosEl.textContent = `${perfil?.puntos_totales ?? 0} pts`;
  pintarAvatar(avatarEl, perfil?.avatar_url, nombre);
}

function pintarAvatar(avatarEl, avatarUrl, nombre) {
  if (!avatarEl) return;
  if (avatarUrl) {
    avatarEl.innerHTML = `<img src="${escapeHTML(avatarUrl)}" alt="Foto de perfil">`;
  } else {
    avatarEl.textContent = (nombre || '?').charAt(0).toUpperCase();
  }
}

// ---------------------------------------------------------------------
// BOTONES DE LA PANTALLA (se enlazan una sola vez)
// ---------------------------------------------------------------------
let botonesEnlazados = false;
function enlazarBotones() {
  if (botonesEnlazados) return;
  botonesEnlazados = true;

  document.getElementById('btn-cambiar-clave')?.addEventListener('click', abrirModalCambiarClave);
  document.getElementById('btn-info-perfil')?.addEventListener('click', abrirModalInfoPerfil);
  document.getElementById('btn-cambiar-foto')?.addEventListener('click', abrirModalCambiarFoto);
  document.getElementById('btn-cambiar-info')?.addEventListener('click', abrirModalCambiarInfo);

  document.getElementById('btn-logout-app')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
}

// =====================================================================
// SISTEMA DE MODAL GENÉRICO
// =====================================================================
function crearModal(titulo, contenidoHTML) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <button class="modal-cerrar" aria-label="Cerrar">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <h3 class="modal-card__titulo">${titulo}</h3>
      ${contenidoHTML}
    </div>
  `;
  document.body.appendChild(overlay);

  const cerrar = () => overlay.remove();
  overlay.querySelector('.modal-cerrar').addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
  document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', escListener); }
  });

  return overlay;
}

// ---------------------------------------------------------------------
// 1) CAMBIAR CONTRASEÑA
// ---------------------------------------------------------------------
function abrirModalCambiarClave() {
  const overlay = crearModal('Cambiar Contraseña', `
    <form id="form-cambiar-clave">
      <div class="input-grupo">
        <label for="clave-nueva">Nueva contraseña</label>
        <input type="password" id="clave-nueva" placeholder="Mínimo 6 caracteres" required autocomplete="new-password" />
      </div>
      <div class="input-grupo">
        <label for="clave-confirmar">Confirmar contraseña</label>
        <input type="password" id="clave-confirmar" placeholder="Repite la contraseña" required autocomplete="new-password" />
      </div>
      <div class="zona-mensajes" id="mensaje-clave"></div>
      <button type="submit" class="btn btn-primario">Guardar Contraseña</button>
    </form>
  `);

  overlay.querySelector('#form-cambiar-clave').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nueva = document.getElementById('clave-nueva').value;
    const confirmar = document.getElementById('clave-confirmar').value;
    const mensaje = document.getElementById('mensaje-clave');

    if (nueva.length < 6) {
      mensaje.innerHTML = '<div class="alerta-roja">La contraseña necesita mínimo 6 caracteres.</div>';
      return;
    }
    if (nueva !== confirmar) {
      mensaje.innerHTML = '<div class="alerta-roja">Las contraseñas no coinciden.</div>';
      return;
    }

    const boton = overlay.querySelector('button[type="submit"]');
    boton.disabled = true;

    const { error } = await supabase.auth.updateUser({ password: nueva });

    boton.disabled = false;
    if (error) {
      mensaje.innerHTML = `<div class="alerta-roja">${escapeHTML(error.message)}</div>`;
      return;
    }
    mensaje.innerHTML = '<div class="alerta-verde">Contraseña actualizada correctamente.</div>';
    setTimeout(() => overlay.remove(), 1400);
  });
}

// ---------------------------------------------------------------------
// 2) INFORMACIÓN DE PERFIL (solo lectura)
// ---------------------------------------------------------------------
function abrirModalInfoPerfil() {
  const nombre = perfilActual?.username || sesionActual?.user?.email || 'Invitado';
  const correo = sesionActual?.user?.email || '—';
  const puntos = perfilActual?.puntos_totales ?? 0;
  const miembroDesde = sesionActual?.user?.created_at
    ? new Date(sesionActual.user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  crearModal('Información de Perfil', `
    <div class="modal-info-fila"><span>Usuario</span><span>${escapeHTML(nombre)}</span></div>
    <div class="modal-info-fila"><span>Correo</span><span>${escapeHTML(correo)}</span></div>
    <div class="modal-info-fila"><span>Puntos totales</span><span>${escapeHTML(String(puntos))}</span></div>
    <div class="modal-info-fila"><span>Miembro desde</span><span>${escapeHTML(miembroDesde)}</span></div>
  `);
}

// ---------------------------------------------------------------------
// 3) CAMBIAR FOTO DE PERFIL (por URL, mismo patrón que banners/videos)
// ---------------------------------------------------------------------
function abrirModalCambiarFoto() {
  if (!sesionActual) { alert('Necesitas iniciar sesión para cambiar tu foto.'); return; }

  const overlay = crearModal('Cambiar Foto de Perfil', `
    <form id="form-cambiar-foto">
      <div class="input-grupo">
        <label for="foto-url">URL de la imagen</label>
        <input type="url" id="foto-url" placeholder="https://..." value="${escapeHTML(perfilActual?.avatar_url || '')}" required />
      </div>
      <div class="zona-mensajes" id="mensaje-foto"></div>
      <button type="submit" class="btn btn-primario">Guardar Foto</button>
    </form>
  `);

  overlay.querySelector('#form-cambiar-foto').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const url = document.getElementById('foto-url').value.trim();
    const mensaje = document.getElementById('mensaje-foto');
    const boton = overlay.querySelector('button[type="submit"]');
    boton.disabled = true;

    const { error } = await supabase.from('usuarios').update({ avatar_url: url }).eq('id', sesionActual.user.id);

    boton.disabled = false;
    if (error) {
      mensaje.innerHTML = `<div class="alerta-roja">${escapeHTML(error.message)}</div>`;
      return;
    }

    perfilActual = { ...perfilActual, avatar_url: url };
    pintarAvatar(document.getElementById('perfil-avatar'), url, perfilActual?.username);
    mensaje.innerHTML = '<div class="alerta-verde">Foto actualizada correctamente.</div>';
    setTimeout(() => overlay.remove(), 1200);
  });
}

// ---------------------------------------------------------------------
// 4) CAMBIAR INFORMACIÓN (nombre de usuario)
// ---------------------------------------------------------------------
function abrirModalCambiarInfo() {
  if (!sesionActual) { alert('Necesitas iniciar sesión para editar tu información.'); return; }

  const overlay = crearModal('Cambiar Información', `
    <form id="form-cambiar-info">
      <div class="input-grupo">
        <label for="info-usuario">Nombre de usuario</label>
        <input type="text" id="info-usuario" placeholder="Tu nombre de otaku" value="${escapeHTML(perfilActual?.username || '')}" required />
      </div>
      <div class="zona-mensajes" id="mensaje-info"></div>
      <button type="submit" class="btn btn-primario">Guardar Cambios</button>
    </form>
  `);
  // Nota: cuando definan más columnas editables en "usuarios" (bio,
  // anime favorito, redes sociales, etc.) se agregan aquí como
  // input-grupo adicionales, siguiendo el mismo patrón.

  overlay.querySelector('#form-cambiar-info').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const username = document.getElementById('info-usuario').value.trim();
    const mensaje = document.getElementById('mensaje-info');

    if (!username) {
      mensaje.innerHTML = '<div class="alerta-roja">El nombre de usuario no puede estar vacío.</div>';
      return;
    }

    const boton = overlay.querySelector('button[type="submit"]');
    boton.disabled = true;

    const { error } = await supabase.from('usuarios').update({ username }).eq('id', sesionActual.user.id);

    boton.disabled = false;
    if (error) {
      mensaje.innerHTML = `<div class="alerta-roja">${escapeHTML(error.message)}</div>`;
      return;
    }

    perfilActual = { ...perfilActual, username };
    document.getElementById('perfil-nombre').textContent = username;
    document.getElementById('navbar-username').textContent = username;
    mensaje.innerHTML = '<div class="alerta-verde">Información actualizada correctamente.</div>';
    setTimeout(() => overlay.remove(), 1200);
  });
}

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
