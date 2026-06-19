// =====================================================================
// ME GUSTA EL ANIME · js/auth.js
// ---------------------------------------------------------------------
// Lógica de la pantalla de Login/Registro (index.html).
// Responsabilidades:
//   1. Si ya hay sesión activa -> redirigir directo al dashboard.
//   2. Animar el "split panel" (alternar Login <-> Registro).
//   3. Cargar los banners de fondo desde la tabla "configuracion".
//   4. Registrar usuarios nuevos (signUp) guardando username y país.
//   5. Iniciar sesión y BLOQUEAR si el correo no está verificado,
//      mostrando la alerta amarilla pedida en el brief.
//   6. Recuperación de contraseña ("¿Olvidaste tu contraseña?").
// =====================================================================

import { supabase, obtenerSesion } from './supabase.js';

// ---------------------------------------------------------------------
// 0) REFERENCIAS AL DOM
// ---------------------------------------------------------------------
// Guardamos en variables todos los elementos del HTML con los que
// vamos a interactuar. Si cambias un id en index.html, cámbialo
// también aquí.
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
// Ambos formularios existen siempre en el HTML. Solo agregamos o
// quitamos la clase ".activo" para que login.css haga el slide.
function mostrarFormulario(nombre) {
  if (nombre === 'registro') {
    formLogin.classList.remove('activo');
    formRegistro.classList.add('activo');
  } else {
    formRegistro.classList.remove('activo');
    formLogin.classList.add('activo');
  }
  // Limpiamos mensajes de error/alerta al cambiar de formulario
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
  // tipo puede ser: 'roja' (error), 'amarilla' (verificación) o 'verde' (éxito)
  zona.innerHTML = `<div class="alerta-${tipo}">${texto}</div>`;
}

// ---------------------------------------------------------------------
// 4) CARGAR BANNERS DE FONDO DESDE SUPABASE (tabla "configuracion")
// ---------------------------------------------------------------------
// Buscamos todas las filas cuya "clave" empiece con "banner_login_" y
// estén marcadas como activas, ordenadas por la columna "orden".
// Con esas URLs creamos un pequeño carrusel de fondo.
async function cargarBannersLogin() {
  if (!panelVisual) return;

  const { data, error } = await supabase
    .from('configuracion')
    .select('valor, orden')
    .like('clave', 'banner_login_%')
    .eq('activo', true)
    .order('orden', { ascending: true });

  // Si hay un error o no hay banners configurados todavía, dejamos un
  // fondo oscuro de respaldo (definido en login.css con :root) y no
  // rompemos la página.
  if (error || !data || data.length === 0) {
    console.warn('No se encontraron banners en "configuracion". Usando fondo por defecto.');
    return;
  }

  // Creamos un <div class="panel-visual__slide"> por cada imagen
  data.forEach((fila, indice) => {
    const slide = document.createElement('div');
    slide.className = 'panel-visual__slide';
    slide.style.backgroundImage = `url('${fila.valor}')`;
    if (indice === 0) slide.classList.add('activa');
    panelVisual.prepend(slide); // prepend para que quede DETRÁS del degradado y el branding
  });

  // Si hay más de un banner, rotamos cada 6 segundos
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
// 5) REGISTRO DE USUARIO NUEVO
// ---------------------------------------------------------------------
formRegistro?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarMensajes(zonaMensajesRegistro);

  // Tomamos los valores de los campos del formulario de registro
  const username = document.getElementById('reg-username').value.trim();
  const codigoPais = document.getElementById('reg-codigo-pais').value;
  const email = document.getElementById('reg-email').value.trim();
  const password1 = document.getElementById('reg-password1').value;
  const password2 = document.getElementById('reg-password2').value;

  // --- Validaciones básicas en el cliente (la validación real y de
  // seguridad ocurre siempre en Supabase / la base de datos) ---
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

  // signUp() crea el usuario en auth.users. Los datos que mandamos en
  // "options.data" llegan a "raw_user_meta_data" y el TRIGGER que
  // creamos en schema.sql los usa para llenar la tabla "usuarios".
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

  // --- MODIFICACIÓN DE CIRUGÍA: FRICCIÓN CERO ---
  // El usuario ya se registró, salta directamente al dashboard.
  window.location.href = 'dashboard.html';
});

// ---------------------------------------------------------------------
// 6) INICIO DE SESIÓN + BLOQUEO POR CORREO NO VERIFICADO
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
    // Supabase devuelve el mensaje "Email not confirmed" cuando el
    // usuario existe pero no ha hecho clic en el enlace del correo.
    // Aquí es donde mostramos la alerta AMARILLA pedida en el brief.
    if (error.message.toLowerCase().includes('email not confirmed')) {
      mostrarMensaje(
        zonaMensajesLogin,
        'Verifica tu correo electrónico siguiendo los pasos 1, 2, 3 y 4 antes de ingresar.',
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

  // redirectTo: a dónde te lleva Supabase DESPUÉS de hacer clic en el
  // enlace del correo de recuperación. Debe ser una página de tu sitio
  // donde el usuario pueda escribir su nueva contraseña.
  // Por simplicidad lo mandamos a index.html; Supabase abrirá una
  // sesión temporal y podrías mostrar un formulario de "nueva
  // contraseña" detectando el evento "PASSWORD_RECOVERY" (ver nota
  // abajo).
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
// Cuando el usuario llega desde el enlace del correo de recuperación,
// Supabase dispara este evento. Aquí simplemente le pedimos una nueva
// contraseña con un prompt sencillo (puedes reemplazar esto por un
// formulario propio más adelante si quieres mejorarlo).
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
