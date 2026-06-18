// =====================================================================
// OTAKU NEXUS · js/app.js
// Lógica de UI (Pestañas, Modal Ajustes) y Mini-juegos (Pokémon)
// =====================================================================

const app = {
  // --- NAVEGACIÓN DE PESTAÑAS ---
  cambiarTab(idTab, elementoNav = null) {
    // 1. Cerrar ajustes si están abiertos
    this.cerrarAjustes();

    // 2. Ocultar todas las pestañas
    document.querySelectorAll('.tab-pane').forEach(tab => {
      tab.classList.remove('activa');
    });

    // 3. Mostrar la seleccionada
    document.getElementById(`tab-${idTab}`).classList.add('activa');

    // 4. Cambiar estilo del botón inferior si se hizo clic en él
    if (elementoNav) {
      document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
        btn.classList.remove('activo');
      });
      elementoNav.classList.add('activo');
    }
  },

  // --- MODAL DE AJUSTES ---
  abrirAjustes() {
    document.getElementById('settings-modal').classList.add('abierto');
    document.getElementById('settings-overlay').classList.add('activo');
  },

  cerrarAjustes() {
    document.getElementById('settings-modal').classList.remove('abierto');
    document.getElementById('settings-overlay').classList.remove('activo');
  },

  // --- SISTEMA POKÉMON BATTLE ---
  batalla: {
    pHP: 100,
    eHP: 100,
    enBatalla: false,
    nombres: {
      'charmander': 'Charmander',
      'squirtle': 'Squirtle',
      'bulbasaur': 'Bulbasaur'
    },
    sprites: {
      'charmander': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
      'squirtle': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/7.png',
      'bulbasaur': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png'
    }
  },

  abrirSeleccionPokemon() {
    this.cambiarTab('pokemon-select');
  },

  iniciarBatalla(pokemonKey) {
    this.batalla.pHP = 100;
    this.batalla.eHP = 100;
    this.batalla.enBatalla = true;
    
    // Configurar UI Visual
    document.getElementById('player-sprite').src = this.batalla.sprites[pokemonKey];
    document.getElementById('player-name').innerHTML = `${this.batalla.nombres[pokemonKey]} <span>Lv50</span>`;
    this.escribirMensaje(`¡Ve, ${this.batalla.nombres[pokemonKey]}!`);
    
    this.actualizarBarras();
    this.cambiarTab('pokemon-battle');
  },

  actualizarBarras() {
    const pBar = document.getElementById('player-hp');
    const eBar = document.getElementById('enemy-hp');
    const b = this.batalla;
    
    pBar.style.width = b.pHP + '%';
    eBar.style.width = b.eHP + '%';
    document.getElementById('player-hp-text').innerText = `${b.pHP}/100`;

    // Colores según vida restante
    pBar.style.background = b.pHP > 50 ? '#4cd97b' : b.pHP > 20 ? '#f5d142' : '#ff3131';
    eBar.style.background = b.eHP > 50 ? '#4cd97b' : b.eHP > 20 ? '#f5d142' : '#ff3131';
  },

  escribirMensaje(msg) {
    document.getElementById('battle-text').innerText = msg;
  },

  atacar(dmg, nombreAtaque) {
    if (!this.batalla.enBatalla) return;
    
    this.escribirMensaje(`¡Usaste ${nombreAtaque}!`);
    
    // Animación de ataque al enemigo
    const eSprite = document.getElementById('enemy-sprite');
    eSprite.style.opacity = '0.5';
    setTimeout(() => eSprite.style.opacity = '1', 150);
    setTimeout(() => eSprite.style.opacity = '0.5', 300);
    setTimeout(() => eSprite.style.opacity = '1', 450);

    setTimeout(() => {
      this.batalla.eHP -= dmg;
      if (this.batalla.eHP < 0) this.batalla.eHP = 0;
      this.actualizarBarras();
      
      if (this.batalla.eHP === 0) {
        this.escribirMensaje('¡Alakazam enemigo se debilitó! ¡Ganaste!');
        this.batalla.enBatalla = false;
        setTimeout(() => this.cambiarTab('games'), 3000);
      } else {
        this.turnoEnemigo();
      }
    }, 500);
  },

  curar() {
    if (!this.batalla.enBatalla) return;
    this.escribirMensaje(`¡Usaste una Poción!`);
    setTimeout(() => {
      this.batalla.pHP += 40;
      if (this.batalla.pHP > 100) this.batalla.pHP = 100;
      this.actualizarBarras();
      this.turnoEnemigo();
    }, 1000);
  },

  turnoEnemigo() {
    setTimeout(() => {
      this.escribirMensaje('¡Alakazam usó Psíquico!');
      
      const pSprite = document.getElementById('player-sprite');
      pSprite.style.opacity = '0.5';
      setTimeout(() => pSprite.style.opacity = '1', 150);

      setTimeout(() => {
        // Daño aleatorio entre 15 y 30
        this.batalla.pHP -= Math.floor(Math.random() * 16) + 15; 
        if (this.batalla.pHP < 0) this.batalla.pHP = 0;
        this.actualizarBarras();
        
        if (this.batalla.pHP === 0) {
          this.escribirMensaje('¡Tu Pokémon se debilitó! Perdiste...');
          this.batalla.enBatalla = false;
          setTimeout(() => this.cambiarTab('games'), 3000);
        } else {
          this.escribirMensaje('¿Qué vas a hacer?');
        }
      }, 500);
    }, 1500);
  }
};

// Exponer la app globalmente para que funcione en los onclick del HTML
window.app = app;
