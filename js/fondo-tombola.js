/* =========================================================
   ME GUSTA EL ANIME — js/fondo-tombola.js
   Responsabilidad única: decidir qué animación se ve dentro
   de .animacion-box (tanto en el panel de registro como en el
   de login — solo uno es visible a la vez, pero se mantienen
   los dos iframes sincronizados al mismo valor).

   Reglas:
   1) Carga fija: "megustaelanime.html" siempre al entrar/recargar.
   2) Primer clic en "Registrarse": aleatorio SOLO entre las 5
      animaciones que NO son la de bienvenida.
   3) De ahí en adelante (cualquier cambio de pestaña): aleatorio
      libre entre las 6.

   No sabe nada de formularios. Expone únicamente:
     window.FondoTombola.notificarCambioDePestana(tab)
   auth-ui.js lo llama cuando el usuario cambia de pestaña.
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

    // Cada animación tiene su propio tamaño calculado (ver css/login.css).
    // Sin esto, todas comparten la misma caja y se ven o apretadas o
    // demasiado sueltas según el archivo.
    const TALLAS = {
        'megustaelanime.html': 'talla-brand',
        'barcoluffy.html': 'talla-barco',
        'clones-naruto.html': 'talla-naruto',
        'goku.html': 'talla-goku',
        'nubeakatsuki.html': 'talla-nube',
        'sololeveling.html': 'talla-solo'
    };
    const TODAS_LAS_TALLAS = Object.values(TALLAS);

    const frames = [
        document.getElementById('tombolaRegistro'),
        document.getElementById('tombolaLogin')
    ].filter(Boolean);

    let actual = BIENVENIDA;
    let primerCambioDeRegistroHecho = false;

    function elegirDistintoAlActual(lista) {
        const opciones = lista.filter((archivo) => archivo !== actual);
        const fuente = opciones.length ? opciones : lista;
        return fuente[Math.floor(Math.random() * fuente.length)];
    }

    function mostrarEnFrames(nuevoSrc) {
        actual = nuevoSrc;
        const claseTalla = TALLAS[nuevoSrc];

        frames.forEach((frame) => {
            frame.classList.remove('cargado');
            TODAS_LAS_TALLAS.forEach((clase) => frame.classList.remove(clase));
            if (claseTalla) frame.classList.add(claseTalla);

            const alTerminarDeCargar = () => {
                frame.classList.add('cargado');
                frame.removeEventListener('load', alTerminarDeCargar);
            };
            frame.addEventListener('load', alTerminarDeCargar, { once: true });
            frame.src = nuevoSrc;
        });
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

        mostrarEnFrames(siguiente);
    }

    // Revela con fade-in la animación de bienvenida apenas cargue la primera vez
    frames.forEach((frame) => {
        frame.addEventListener('load', () => frame.classList.add('cargado'), { once: true });
    });

    window.FondoTombola = { notificarCambioDePestana };
})();
