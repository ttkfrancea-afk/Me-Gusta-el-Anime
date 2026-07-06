/* =========================================================
   ME GUSTA EL ANIME — fondo-tombola.js
   Responsabilidad única: decidir y mostrar qué animación de
   fondo se ve en el panel-visual, con cross-fade entre dos
   iframes (doble buffer) para que el cambio nunca se sienta
   como un salto o un pantallazo negro.

   Reglas:
   1) Carga fija: "megustaelanime.html" siempre al entrar/recargar.
   2) Primer clic en "Registrarse": aleatorio SOLO entre las 5
      animaciones que NO son la de bienvenida.
   3) De ahí en adelante (cualquier cambio de pestaña): aleatorio
      libre entre las 6.

   Este archivo NO sabe nada de formularios ni de Supabase.
   Expone únicamente: window.FondoTombola.notificarCambioDePestana(tab)
   auth.js lo llama cuando el usuario cambia de pestaña.
   ========================================================= */

(function () {
  const BIENVENIDA = 'megustaelanime.html';

  const SIN_BIENVENIDA = [
    'barcoluffy.html',
    'clones-naruto.html',
    'goku.html',
    'nubeakatsuki.html',
    'sololeveling.html'
  ];

  const TODAS = [...SIN_BIENVENIDA, BIENVENIDA];

  const iframeA = document.getElementById('fondoA');
  const iframeB = document.getElementById('fondoB');

  if (!iframeA || !iframeB) return; // seguridad: si el markup no está, no truena nada más

  let activo = iframeA;
  let inactivo = iframeB;
  let primerCambioDeRegistroHecho = false;

  function elegirDistintoAlActual(lista) {
    const actual = activo.getAttribute('data-actual') || BIENVENIDA;
    const opciones = lista.filter((archivo) => archivo !== actual);
    const fuente = opciones.length ? opciones : lista;
    return fuente[Math.floor(Math.random() * fuente.length)];
  }

  function cambiarFondoA(nuevoSrc) {
    if (!nuevoSrc || nuevoSrc === activo.getAttribute('data-actual')) return;

    inactivo.setAttribute('data-actual', nuevoSrc);

    const alTerminarDeCargar = () => {
      inactivo.classList.add('activa');
      activo.classList.remove('activa');

      const temp = activo;
      activo = inactivo;
      inactivo = temp;

      inactivo.removeEventListener('load', alTerminarDeCargar);
    };

    inactivo.addEventListener('load', alTerminarDeCargar, { once: true });
    inactivo.src = nuevoSrc;
  }

  function notificarCambioDePestana(tabDestino) {
    let siguiente;

    if (tabDestino === 'register' && !primerCambioDeRegistroHecho) {
      siguiente = elegirDistintoAlActual(SIN_BIENVENIDA);
      primerCambioDeRegistroHecho = true;
    } else {
      primerCambioDeRegistroHecho = true; // a partir de aquí, tómbola libre
      siguiente = elegirDistintoAlActual(TODAS);
    }

    cambiarFondoA(siguiente);
  }

  window.FondoTombola = { notificarCambioDePestana };
})();
