/* =========================================================
   ME GUSTA EL ANIME — js/login/social-auth.js
   ---------------------------------------------------------
   Responsabilidad única: conectar los botones "Google" y
   "Facebook" que ya existen en index.html (paneles de Login
   y Registro) con el inicio de sesión OAuth de Supabase.
   No dibuja nada nuevo en el DOM, solo escucha los botones
   .btn-google / .btn-facebook.

   Requisito en Supabase (fuera de este código, una sola vez):
     Dashboard -> Authentication -> Providers -> Google -> Enable
     (con el Client ID / Secret de Google Cloud Console, y esta
     URL del sitio agregada en "Authorized redirect URIs").
     Lo mismo para Facebook si vas a usar ese botón también.
     Sin ese paso en el dashboard, el botón sigue sin funcionar
     aunque el código esté correcto — esa parte no se puede
     hacer desde el código.
   ========================================================= */

import { supabase } from '../core/supabase.js';

async function iniciarSesionConProveedor(proveedor) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: `${window.location.origin}/dashboard.html`,
    },
  });

  if (error) {
    console.error(`Error iniciando sesión con ${proveedor}:`, error.message);
    alert('No se pudo iniciar sesión. Intenta de nuevo.');
  }
  // Si no hay error, Supabase redirige automáticamente al proveedor;
  // no hace falta hacer nada más aquí.
}

document.querySelectorAll('.btn-google').forEach((boton) => {
  boton.addEventListener('click', () => iniciarSesionConProveedor('google'));
});

document.querySelectorAll('.btn-facebook').forEach((boton) => {
  boton.addEventListener('click', () => iniciarSesionConProveedor('facebook'));
});
