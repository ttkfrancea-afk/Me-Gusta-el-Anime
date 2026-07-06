// =====================================================================
// ME GUSTA EL ANIME · js/auth.js
// ---------------------------------------------------------------------
// FASE ACTUAL: solo interfaz (visual/interacción). Este archivo NO se
// conecta todavía a Supabase Auth a propósito — eso se hace en la
// siguiente fase ("lo mecánico"). Aquí solo dejamos listo:
//   1. El alternado Login <-> Registro (y avisarle a la tómbola de fondo).
//   2. El disparo de la animación "portal" hacia el dashboard.
// =====================================================================

const veil = document.getElementById('portal-veil');
const splitPanel = document.getElementById('split-panel');

// ---------------------------------------------------------------------
// 1) ALTERNAR LOGIN / REGISTRO
//    (la tómbola de fondo —js/fondo-tombola.js— decide sola qué
//    animación mostrar; aquí solo le avisamos que hubo un cambio)
// ---------------------------------------------------------------------
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

document.getElementById('ir-a-registro').addEventListener('click', () => {
  formLogin.classList.remove('activo');
  formRegistro.classList.add('activo');

  if (window.FondoTombola) {
    window.FondoTombola.notificarCambioDePestana('register');
  }
});

document.getElementById('ir-a-login').addEventListener('click', () => {
  formRegistro.classList.remove('activo');
  formLogin.classList.add('activo');

  if (window.FondoTombola) {
    window.FondoTombola.notificarCambioDePestana('login');
  }
});

// ---------------------------------------------------------------------
// 2) EL PORTAL: velo + tarjeta 3D + navegación al dashboard
// ---------------------------------------------------------------------
function dispararPortal(eventoOrigen) {
  // El portal "nace" desde donde el usuario tocó el botón, para que
  // se sienta conectado a su acción y no como un efecto genérico.
  const x = eventoOrigen ? `${(eventoOrigen.clientX / window.innerWidth) * 100}%` : '50%';
  const y = eventoOrigen ? `${(eventoOrigen.clientY / window.innerHeight) * 100}%` : '50%';
  veil.style.setProperty('--origen-x', x);
  veil.style.setProperty('--origen-y', y);

  veil.classList.add('veil--cerrando');
  splitPanel.classList.add('portal-saliendo');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 700);
}

// ---------------------------------------------------------------------
// 3) ENVÍO DE FORMULARIOS (validación básica de interfaz)
// ---------------------------------------------------------------------
formLogin.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const mensajes = document.getElementById('mensajes-login');

  if (!email || !password) {
    mensajes.innerHTML = '<div class="alerta-roja">Completa correo y contraseña.</div>';
    return;
  }

  // TODO (fase backend): reemplazar por
  // const { error } = await supabase.auth.signInWithPassword({ email, password });
  // y manejar el caso "Email not confirmed" con la alerta-amarilla.
  mensajes.innerHTML = '';
  dispararPortal(evento.submitter ? { clientX: evento.submitter.getBoundingClientRect().x, clientY: evento.submitter.getBoundingClientRect().y } : null);
});

formRegistro.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const usuario = document.getElementById('registro-usuario').value.trim();
  const email = document.getElementById('registro-email').value.trim();
  const password = document.getElementById('registro-password').value;
  const mensajes = document.getElementById('mensajes-registro');

  if (!usuario || !email || password.length < 6) {
    mensajes.innerHTML = '<div class="alerta-roja">Revisa los datos: la contraseña necesita mínimo 6 caracteres.</div>';
    return;
  }

  // TODO (fase backend): reemplazar por
  // const { error } = await supabase.auth.signUp({ email, password, options: { data: { username: usuario } } });
  // y mostrar la alerta-amarilla pidiendo verificar el correo.
  mensajes.innerHTML = '<div class="alerta-verde">Cuenta creada (demo). Conectaremos esto a Supabase en la siguiente fase.</div>';
});

// ---------------------------------------------------------------------
// 4) "OLVIDÉ MI CONTRASEÑA" (placeholder de interfaz)
// ---------------------------------------------------------------------
document.getElementById('btn-olvido-password').addEventListener('click', () => {
  const mensajes = document.getElementById('mensajes-login');
  // TODO (fase backend): supabase.auth.resetPasswordForEmail(email)
  mensajes.innerHTML = '<div class="alerta-amarilla">Pronto podrás recuperar tu contraseña desde aquí.</div>';
});
