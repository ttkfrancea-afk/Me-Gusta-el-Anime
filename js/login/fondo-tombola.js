/* =========================================================
   ME GUSTA EL ANIME — js/login/fondo-tombola.js
   Responsabilidad única: decidir qué animación se ve (misma
   regla de siempre) y pedirle a Escenas (js/login/escenas.js)
   que la construya dentro del login — ya no hay iframes que
   cambiar de src, hay escenas que se inyectan/limpian.

   Reglas:
   1) Carga fija: "megustaelanime.html" siempre al entrar/recargar.
   2) Primer clic en "Registrarse": aleatorio SOLO entre las 5
      animaciones que NO son la de bienvenida.
   3) De ahí en adelante (cualquier cambio de pestaña): aleatorio
      libre entre las 6.

   Expone: window.FondoTombola.notificarCambioDePestana(tab)
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

    const contenedores = [
        document.getElementById('escenaRegistro'),
        document.getElementById('escenaLogin')
    ].filter(Boolean);

    let actual = BIENVENIDA;
    let primerCambioDeRegistroHecho = false;

    function elegirDistintoAlActual(lista) {
        const opciones = lista.filter((archivo) => archivo !== actual);
        const fuente = opciones.length ? opciones : lista;
        return fuente[Math.floor(Math.random() * fuente.length)];
    }

    function mostrarEnContenedores(nombre) {
        actual = nombre;
        contenedores.forEach((contenedor) => {
            if (window.Escenas) window.Escenas.mostrar(nombre, contenedor);
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

        mostrarEnContenedores(siguiente);
    }

    // Carga fija inicial en ambos contenedores
    mostrarEnContenedores(BIENVENIDA);

    window.FondoTombola = { notificarCambioDePestana };
})();
