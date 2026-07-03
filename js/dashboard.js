// =====================================================================
// OTAKU NEXUS · js/dashboard.js
// ---------------------------------------------------------------------
// Orquestador del cascarón. Cada pestaña del bottom-nav es una
// pantalla completa e independiente (tab-pane); este archivo solo
// decide CUÁNDO mostrar cada una y CUÁNDO inicializar su módulo.
//
// Nota de alcance: la verificación de sesión (redirigir a index.html
// si no hay usuario logueado) queda pendiente para la fase de backend,
// tal como acordamos. Por ahora, si hay sesión activa mostramos los
// datos reales del usuario; si no, mostramos placeholders.
// =====================================================================

import { supabase } from './supabase.js';
import { initInicio } from './feed.js';
import { initArcade } from './arcade.js';
import { initQuiz } from './quiz-loader.js';
import { initAjustes } from './ajustes.js';

const veil = document.getElementById('portal-veil');
const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');

const modulos = {
  home: { init: initInicio, listo: false },
  search: { init: null, listo: true }, // pantalla estática por ahora
  arcade: { init: initArcade, listo: false },
  quiz: { init: initQuiz, listo: false },
  ajustes: { init: initAjustes, listo: false },
};

// ---------------------------------------------------------------------
// 1) ABRIR EL PORTAL AL CARGAR (el velo ya llega "cerrado" desde el HTML)
// ---------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    veil.classList.add('veil--abriendo');
  });
  setTimeout(() => veil.remove(), 950);

  aplicarCascada(document.getElementById('tab-home'));
  modulos.home.init?.();
  modulos.home.listo = true;
});

// ---------------------------------------------------------------------
// 2) CAMBIO DE PESTAÑA
// ---------------------------------------------------------------------
function cambiarTab(idTab, elementoNav) {
  document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('activa'));
  const pane = document.getElementById(`tab-${idTab}`);
  pane.classList.add('activa');
  aplicarCascada(pane);

  bottomNavItems.forEach((item) => item.classList.remove('activo'));
  elementoNav.classList.add('activo');

  const modulo = modulos[idTab];
  if (modulo && !modulo.listo && modulo.init) {
    modulo.init();
    modulo.listo = true;
  }
}

bottomNavItems.forEach((item) => {
  item.addEventListener('click', () => cambiarTab(item.dataset.tab, item));
});

// ---------------------------------------------------------------------
// 3) ENTRADA EN CASCADA — cada hijo directo de la pestaña activa entra
//    con un pequeño retraso escalonado (efecto "app nativa")
// ---------------------------------------------------------------------
function aplicarCascada(pane) {
  const hijos = pane.querySelectorAll(':scope > section, :scope > .perfil-card');
  hijos.forEach((hijo, i) => {
    hijo.classList.remove('stagger-in');
    void hijo.offsetWidth; // reinicia la animación si se repite
    hijo.style.setProperty('--stagger-delay', `${i * 0.08}s`);
    hijo.classList.add('stagger-in');
  });
}

// ---------------------------------------------------------------------
// 4) DATOS DE SESIÓN PARA LA NAVBAR (sin forzar redirección todavía)
// ---------------------------------------------------------------------
async function pintarSesionEnNavbar() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // se queda con los placeholders del HTML

  const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
  document.getElementById('navbar-username').textContent = perfil?.username || session.user.email;
  document.getElementById('navbar-puntos').textContent = perfil?.puntos_totales ?? 0;
}
pintarSesionEnNavbar();

window.dashboardApp = { cambiarTab, supabase };
