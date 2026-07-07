/* =========================================================
   ME GUSTA EL ANIME — js/escenas.js
   ---------------------------------------------------------
   Reemplaza el viejo sistema de iframes. Cada escena es una
   función que:
     1) devuelve el HTML real de la animación (plantilla),
     2) opcionalmente arranca su propia lógica JS (precarga de
        imágenes, cambios de fase, generación de rayos, etc.),
     3) devuelve una función "destruir" para limpiar cualquier
        setInterval/setTimeout cuando se cambia de animación
        (esto es importante: como ya no es un documento aparte
        que el navegador destruye solo al cambiar el src de un
        iframe, aquí SÍ hay que apagar los timers a mano o
        se quedan corriendo en segundo plano para siempre).

   Uso: window.Escenas.mostrar('goku.html', contenedor)
        window.Escenas.limpiar(contenedor)  // antes de cambiar
   ========================================================= */

(function () {
    const BASE_IMG = 'https://zccbphmebkpuzwbkgtse.supabase.co/storage/v1/object/public/mis-imagenes/imagenes%20de%20login/';

    // Guarda la función de limpieza activa por cada contenedor
    const limpiezaActiva = new WeakMap();

    function limpiar(contenedor) {
        const destruir = limpiezaActiva.get(contenedor);
        if (typeof destruir === 'function') {
            try { destruir(); } catch (e) { /* nunca romper por esto */ }
        }
        limpiezaActiva.delete(contenedor);
        contenedor.innerHTML = '';
    }

    /* ---------------------------------------------------------------
       MARCA — Me Gusta el Anime (pura CSS, sin JS)
       --------------------------------------------------------------- */
    function crearBrand(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-brand">
                <div class="escena-brand__caja">
                    <img src="${BASE_IMG}me%20gusta%20el%20anime%20.webp" alt="Me Gusta el Anime">
                </div>
            </div>`;
    }

    /* ---------------------------------------------------------------
       GOKU — fases de imagen + rayos (con limpieza de timers)
       --------------------------------------------------------------- */
    function crearGoku(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-goku">
                <div class="escena-goku__destello"></div>
                <div class="escena-goku__escenario">
                    <div class="escena-goku__aura"></div>
                    <div class="escena-goku__suelo"></div>
                    <img src="${BASE_IMG}trancion%202..webp" alt="Goku" class="escena-goku__personaje">
                    <div class="escena-goku__rayos"></div>
                    <div class="escena-goku__polvo"></div>
                </div>
            </div>`;

        const goku = contenedor.querySelector('.escena-goku__personaje');
        const rayosContenedor = contenedor.querySelector('.escena-goku__rayos');
        const urlFase2 = `${BASE_IMG}trancion%202..webp`;
        const urlFase3 = `${BASE_IMG}trancion%203..webp`;

        let enFase3 = false;
        let intervaloRayos = null;
        let timeoutFase3 = null;

        function generarRayoChispa() {
            if (!enFase3) return;
            const fragmento = document.createDocumentFragment();
            for (let i = 0; i < 2; i++) {
                const rayo = document.createElement('div');
                rayo.className = 'escena-goku__rayo';
                const esVertical = Math.random() > 0.5;
                const ancho = esVertical ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 20) + 15;
                const alto = esVertical ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 2) + 2;
                rayo.style.width = ancho + 'px';
                rayo.style.height = alto + 'px';
                rayo.style.top = (Math.floor(Math.random() * 70) + 10) + '%';
                rayo.style.left = (Math.floor(Math.random() * 50) + 25) + '%';
                const rot = Math.floor(Math.random() * 360);
                rayo.style.transform = 'rotate(' + rot + 'deg)';
                rayo.style.setProperty('--dx', (Math.random() > 0.5 ? 20 : -20) + 'px');
                rayo.style.setProperty('--dy', (Math.random() > 0.5 ? -25 : 15) + 'px');
                fragmento.appendChild(rayo);
                setTimeout(() => rayo.remove(), 75);
            }
            rayosContenedor.appendChild(fragmento);
        }

        function iniciarCicloTransformacion() {
            goku.src = urlFase2;
            enFase3 = false;
            rayosContenedor.textContent = '';
            if (intervaloRayos) clearInterval(intervaloRayos);
            timeoutFase3 = setTimeout(() => {
                goku.src = urlFase3;
                enFase3 = true;
                intervaloRayos = setInterval(generarRayoChispa, 40);
            }, 2666);
        }

        iniciarCicloTransformacion();
        const intervaloCiclo = setInterval(iniciarCicloTransformacion, 8000);

        return function destruir() {
            clearInterval(intervaloCiclo);
            clearInterval(intervaloRayos);
            clearTimeout(timeoutFase3);
        };
    }

    /* ---------------------------------------------------------------
       NARUTO — precarga + clase "ready" (con cancelación si se sale)
       --------------------------------------------------------------- */
    function crearNaruto(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-naruto">
                <div class="escena-naruto__wrapper">
                    <img src="${BASE_IMG}Naruto1.webp" class="escena-naruto__paso escena-naruto__n1">
                    <img src="${BASE_IMG}Naruto2.webp" class="escena-naruto__paso escena-naruto__n2">
                    <img src="${BASE_IMG}Naruto3.webp" class="escena-naruto__paso escena-naruto__n3">

                    <div class="escena-naruto__kurama">
                        <div class="escena-naruto__burbuja escena-naruto__cb1"></div>
                        <div class="escena-naruto__burbuja escena-naruto__cb2"></div>
                        <div class="escena-naruto__burbuja escena-naruto__cb3"></div>
                        <div class="escena-naruto__burbuja escena-naruto__cb4"></div>
                        <div class="escena-naruto__burbuja escena-naruto__cb5"></div>
                    </div>

                    <img src="${BASE_IMG}Naruto4.webp" class="escena-naruto__paso escena-naruto__n4">

                    <div class="escena-naruto__bocadillo">
                        <span class="escena-naruto__texto-jutsu escena-naruto__texto-sombra">Kage Bunshin no Jutsu</span>
                    </div>

                    <div class="escena-naruto__humo escena-naruto__sb1"></div>
                    <div class="escena-naruto__humo escena-naruto__sb2"></div>
                    <div class="escena-naruto__humo escena-naruto__sb3"></div>
                    <div class="escena-naruto__humo escena-naruto__sb4"></div>
                    <div class="escena-naruto__humo escena-naruto__sb6"></div>

                    <img src="${BASE_IMG}clon%201.webp" class="escena-naruto__paso escena-naruto__clon escena-naruto__c1">
                    <img src="${BASE_IMG}clon%202.webp" class="escena-naruto__paso escena-naruto__clon escena-naruto__c2">
                    <img src="${BASE_IMG}clon%203.webp" class="escena-naruto__paso escena-naruto__clon escena-naruto__c3">
                    <img src="${BASE_IMG}clon%204.webp" class="escena-naruto__paso escena-naruto__clon escena-naruto__c4">
                    <img src="${BASE_IMG}clon%206.webp" class="escena-naruto__paso escena-naruto__clon escena-naruto__c6">
                </div>
            </div>`;

        const raiz = contenedor.querySelector('.escena-naruto');
        const imagenesJutsu = [
            `${BASE_IMG}Naruto1.webp`, `${BASE_IMG}Naruto2.webp`, `${BASE_IMG}Naruto3.webp`, `${BASE_IMG}Naruto4.webp`,
            `${BASE_IMG}clon%201.webp`, `${BASE_IMG}clon%202.webp`, `${BASE_IMG}clon%203.webp`, `${BASE_IMG}clon%204.webp`, `${BASE_IMG}clon%206.webp`
        ];

        let imagenesCargadas = 0;
        let cancelado = false;
        let timeoutReady = null;

        imagenesJutsu.forEach((src) => {
            const img = new Image();
            img.onload = () => {
                if (cancelado) return;
                imagenesCargadas++;
                if (imagenesCargadas === imagenesJutsu.length) {
                    timeoutReady = setTimeout(() => {
                        if (!cancelado) raiz.classList.add('ready');
                    }, 100);
                }
            };
            img.src = src;
        });

        return function destruir() {
            cancelado = true;
            clearTimeout(timeoutReady);
        };
    }

    /* ---------------------------------------------------------------
       BARCO DE LUFFY (pura CSS, sin JS)
       --------------------------------------------------------------- */
    function crearBarco(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-barco">
                <img src="${BASE_IMG}barco%20luffy.webp" alt="Barco de Luffy" class="escena-barco__img">
            </div>`;
    }

    /* ---------------------------------------------------------------
       NUBE AKATSUKI (pura CSS, sin JS)
       --------------------------------------------------------------- */
    function crearNube(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-nube">
                <div class="escena-nube__contenedor">
                    <div class="escena-nube__brisa"></div>
                    <div class="escena-nube__brisa"></div>
                    <div class="escena-nube__brisa"></div>
                    <img src="${BASE_IMG}nube%20Akatsuki.webp" alt="Nube Akatsuki" class="escena-nube__img">
                </div>
            </div>`;
    }

    /* ---------------------------------------------------------------
       SOLO LEVELING (pura CSS, sin JS)
       --------------------------------------------------------------- */
    function crearSolo(contenedor) {
        contenedor.innerHTML = `
            <div class="escena-solo">
                <div class="escena-solo__escenario">
                    <img src="${BASE_IMG}SungE.webp" alt="Sung Jin-woo Rango E" class="escena-solo__img escena-solo__e">
                    <img src="${BASE_IMG}Monarca.webp" alt="El Monarca de las Sombras" class="escena-solo__img escena-solo__s">
                    <div class="escena-solo__sombras">
                        <div class="escena-solo__calavera escena-solo__sk1"></div>
                        <div class="escena-solo__calavera escena-solo__sk2"></div>
                    </div>
                </div>
            </div>`;
    }

    const CONSTRUCTORES = {
        'megustaelanime.html': crearBrand,
        'goku.html': crearGoku,
        'clones-naruto.html': crearNaruto,
        'barcoluffy.html': crearBarco,
        'nubeakatsuki.html': crearNube,
        'sololeveling.html': crearSolo
    };

    function mostrar(nombre, contenedor) {
        if (!contenedor) return;
        limpiar(contenedor); // apaga cualquier timer de la escena anterior
        const construir = CONSTRUCTORES[nombre];
        if (!construir) return;
        const destruir = construir(contenedor);
        if (typeof destruir === 'function') {
            limpiezaActiva.set(contenedor, destruir);
        }
    }

    window.Escenas = { mostrar, limpiar };
})();
