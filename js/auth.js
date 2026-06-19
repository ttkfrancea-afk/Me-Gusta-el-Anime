// =====================================================================
// ME GUSTA EL ANIME · js/auth.js
// ---------------------------------------------------------------------
// Lógica de la pantalla de Login/Registro (index.html).
// Responsabilidades:
//   1. Si ya hay sesión activa -> redirigir directo al dashboard.
//   2. Animar el "split panel" (alternar Login <-> Registro).
//   3. Cargar los banners de fondo desde la tabla "configuracion".
//   4. Registrar usuarios nuevos (signUp) guardando username y país.
//      (FRICCIÓN CERO: Pasa directo al dashboard sin pedir correo).
//   5. Iniciar sesión.
//   6. Recuperación de contraseña ("¿Olvidaste tu contraseña?").
// =====================================================================

import { supabase, obtenerSesion } from './supabase.js';

// ---------------------------------------------------------------------
// 0) REFERENCIAS AL DOM
// ---------------------------------------------------------------------
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

const btnIrARegistro = document.getElementById('btn-ir-registro');
const btnIrALogin = document.getElementById('btn-ir-login');

const zonaMensajesLogin = document.getElementById('mensajes-login');
const zonaMensajesRegistro = document.getElementById('mensajes-registro');

const enlaceOlvidoPassword = document.getElementById('olvido-password');

const panelVisual = document.getElementById('panel-visual');

// ---------------------------------------------------------------------
// 1) SI YA HAY SESIÓN, NO MOSTRAR EL LOGIN: IR DIRECTO AL DASHBOARD
// ---------------------------------------------------------------------
(async function redirigirSiYaHaySesion() {
  const sesion = await obtenerSesion();
  if (sesion) {
    window.location.href = 'dashboard.html';
  }
})();

// ---------------------------------------------------------------------
// 2) ANIMACIÓN DEL SPLIT PANEL (Login <-> Registro)
// ---------------------------------------------------------------------
function mostrarFormulario(nombre) {
  if (nombre === 'registro') {
    formLogin.classList.remove('activo');
    formRegistro.classList.add('activo');
  } else {
    formRegistro.classList.remove('activo');
    formLogin.classList.add('activo');
  }
  limpiarMensajes(zonaMensajesLogin);
  limpiarMensajes(zonaMensajesRegistro);
}

btnIrARegistro?.addEventListener('click', () => mostrarFormulario('registro'));
btnIrALogin?.addEventListener('click', () => mostrarFormulario('login'));

// ---------------------------------------------------------------------
// 3) HELPERS PARA MOSTRAR MENSAJES (alerta amarilla, roja o verde)
// ---------------------------------------------------------------------
function limpiarMensajes(zona) {
  if (zona) zona.innerHTML = '';
}

function mostrarMensaje(zona, texto, tipo = 'roja') {
  if (!zona) return;
  zona.innerHTML = `<div class="alerta-${tipo}">${texto}</div>`;
}

// ---------------------------------------------------------------------
// 4) CARGAR BANNERS DE FONDO DESDE SUPABASE
// ---------------------------------------------------------------------
async function cargarBannersLogin() {
  if (!panelVisual) return;

  const { data, error } = await supabase
    .from('configuracion')
    .select('valor, orden')
    .like('clave', 'banner_login_%')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    console.warn('No se encontraron banners en "configuracion". Usando fondo por defecto.');
    return;
  }

  data.forEach((fila, indice) => {
    const slide = document.createElement('div');
    slide.className = 'panel-visual__slide';
    slide.style.backgroundImage = `url('${fila.valor}')`;
    if (indice === 0) slide.classList.add('activa');
    panelVisual.prepend(slide);
  });

  const slides = panelVisual.querySelectorAll('.panel-visual__slide');
  if (slides.length > 1) {
    let actual = 0;
    setInterval(() => {
      slides[actual].classList.remove('activa');
      actual = (actual + 1) % slides.length;
      slides[actual].classList.add('activa');
    }, 6000);
  }
}

cargarBannersLogin();

// ---------------------------------------------------------------------
// 5) REGISTRO DE USUARIO NUEVO (FRICCIÓN CERO -> DASHBOARD DIRECTO)
// ---------------------------------------------------------------------
formRegistro?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarMensajes(zonaMensajesRegistro);

  const username = document.getElementById('reg-username').value.trim();
  const codigoPais = document.getElementById('reg-codigo-pais').value;
  const email = document.getElementById('reg-email').value.trim();
  const password1 = document.getElementById('reg-password1').value;
  const password2 = document.getElementById('reg-password2').value;

  if (username.length < 3) {
    mostrarMensaje(zonaMensajesRegistro, 'El nombre de usuario debe tener al menos 3 caracteres.', 'roja');
    return;
  }
  if (password1.length < 6) {
    mostrarMensaje(zonaMensajesRegistro, 'La contraseña debe tener al menos 6 caracteres.', 'roja');
    return;
  }
  if (password1 !== password2) {
    mostrarMensaje(zonaMensajesRegistro, 'Las contraseñas no coinciden.', 'roja');
    return;
  }

  const btnSubmit = formRegistro.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Creando cuenta...';

  const { data, error } = await supabase.auth.signUp({
    email,
    password: password1,
    options: {
      data: {
        username,
        pais_codigo: codigoPais,
      },
    },
  });

  btnSubmit.disabled = false;
  btnSubmit.textContent = 'Crear Cuenta';

  if (error) {
    mostrarMensaje(zonaMensajesRegistro, traducirErrorSupabase(error), 'roja');
    return;
  }

  // --- CIRUGÍA APLICADA ---
  // Al registrarse con éxito, lo mandamos de golpe al dashboard.
  // Ya no pedimos que vaya a revisar el correo ni lo mandamos al login.
  window.location.href = 'dashboard.html';
});

// ---------------------------------------------------------------------
// 6) INICIO DE SESIÓN
// ---------------------------------------------------------------------
formLogin?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarMensajes(zonaMensajesLogin);

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const btnSubmit = formLogin.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Ingresando...';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  btnSubmit.disabled = false;
  btnSubmit.textContent = 'Iniciar Sesión';

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      mostrarMensaje(
        zonaMensajesLogin,
        'Por favor, verifica tu correo electrónico antes de ingresar.',
        'amarilla'
      );
      return;
    }

    mostrarMensaje(zonaMensajesLogin, traducirErrorSupabase(error), 'roja');
    return;
  }

  // Login exitoso -> al dashboard
  window.location.href = 'dashboard.html';
});

// ---------------------------------------------------------------------
// 7) "¿OLVIDASTE TU CONTRASEÑA?"
// ---------------------------------------------------------------------
enlaceOlvidoPassword?.addEventListener('click', async () => {
  limpiarMensajes(zonaMensajesLogin);

  const email = document.getElementById('login-email').value.trim();

  if (!email) {
    mostrarMensaje(zonaMensajesLogin, 'Escribe primero tu correo en el campo de arriba.', 'roja');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/index.html',
  });

  if (error) {
    mostrarMensaje(zonaMensajesLogin, traducirErrorSupabase(error), 'roja');
    return;
  }

  mostrarMensaje(
    zonaMensajesLogin,
    'Te enviamos un correo con instrucciones para restablecer tu contraseña.',
    'verde'
  );
});

// ---------------------------------------------------------------------
// 8) DETECTAR EL EVENTO "PASSWORD_RECOVERY"
// ---------------------------------------------------------------------
supabase.auth.onAuthStateChange(async (evento, sesion) => {
  if (evento === 'PASSWORD_RECOVERY') {
    const nuevaPassword = prompt('Escribe tu nueva contraseña (mínimo 6 caracteres):');
    if (nuevaPassword && nuevaPassword.length >= 6) {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) {
        alert('No se pudo actualizar la contraseña: ' + error.message);
      } else {
        alert('Contraseña actualizada. Ahora puedes iniciar sesión normalmente.');
        window.location.href = 'index.html';
      }
    }
  }
});

// ---------------------------------------------------------------------
// 9) TRADUCTOR SIMPLE DE ERRORES DE SUPABASE AL ESPAÑOL
// ---------------------------------------------------------------------
function traducirErrorSupabase(error) {
  const mensaje = error.message.toLowerCase();

  if (mensaje.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (mensaje.includes('user already registered')) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (mensaje.includes('password should be at least')) {
    return 'La contraseña es demasiado corta.';
  }
  if (mensaje.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }

  return 'Ocurrió un error: ' + error.message;
}
