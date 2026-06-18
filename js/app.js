// =====================================================================
// OTAKU NEXUS · js/app.js
// Controlador central de UI (Pestañas, Modal) y Mini-juegos
// =====================================================================

const app = {
  // --- NAVEGACIÓN ---
  cambiarTab(idTab, elementoNav = null) {
    this.cerrarAjustes();
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('activa'));
    document.getElementById(`tab-${idTab}`).classList.add('activa');

    if (elementoNav) {
      document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => btn.classList.remove('activo'));
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

  // --- ARENA POKÉMON (MEJORADA) ---
  batalla: {
    pHP: 100, eHP: 100, enBatalla: false,
    nombres: { charmander: 'Charmander', squirtle: 'Squirtle', bulbasaur: 'Bulbasaur' },
    sprites: {
      charmander: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
      squirtle: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/7.png',
      bulbasaur: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png'
    }
  },

  abrirSeleccionPokemon() { this.cambiarTab('pokemon-select'); },

  iniciarBatalla(pokemonKey) {
    this.batalla.pHP = 100; this.batalla.eHP = 100; this.batalla.enBatalla = true;
    
    // Resetear Sprites
    const pSprite = document.getElementById('player-sprite');
    const eSprite = document.getElementById('enemy-sprite');
    pSprite.className = 'poke-sprite'; eSprite.className = 'poke-sprite';
    
    pSprite.src = this.batalla.sprites[pokemonKey];
    document.getElementById('player-name').innerHTML = `${this.batalla.nombres[pokemonKey]} <span class="text-yellow">Lv.50</span>`;
    this.escribirMensaje(`¡Adelante, ${this.batalla.nombres[pokemonKey]}!`);
    
    this.actualizarBarras();
    this.cambiarTab('pokemon-battle');
  },

  actualizarBarras() {
    const b = this.batalla;
    const pBar = document.getElementById('player-hp');
    const eBar = document.getElementById('enemy-hp');
    
    pBar.style.width = `${b.pHP}%`; eBar.style.width = `${b.eHP}%`;
    document.getElementById('player-hp-text').innerText = `${b.pHP} / 100`;

    // Cambio de color (Verde -> Amarillo -> Rojo)
    pBar.style.background = b.pHP > 50 ? 'linear-gradient(90deg, #4cd97b, #28a745)' : b.pHP > 20 ? 'linear-gradient(90deg, #f5d142, #d4a017)' : 'linear-gradient(90deg, #ff3131, #b31b1b)';
    eBar.style.background = b.eHP > 50 ? 'linear-gradient(90deg, #4cd97b, #28a745)' : b.eHP > 20 ? 'linear-gradient(90deg, #f5d142, #d4a017)' : 'linear-gradient(90deg, #ff3131, #b31b1b)';
  },

  escribirMensaje(msg) { document.getElementById('battle-text').innerText = msg; },

  animarDanio(spriteId) {
    const sprite = document.getElementById(spriteId);
    sprite.classList.remove('anim-shake');
    void sprite.offsetWidth; // Forzar reflow para reiniciar animación
    sprite.classList.add('anim-shake');
  },

  atacar(dmg, nombreAtaque) {
    if (!this.batalla.enBatalla) return;
    this.escribirMensaje(`¡Usaste ${nombreAtaque}!`);
    
    setTimeout(() => {
      this.animarDanio('enemy-sprite');
      this.batalla.eHP -= dmg;
      if (this.batalla.eHP < 0) this.batalla.eHP = 0;
      this.actualizarBarras();
      
      if (this.batalla.eHP === 0) {
        this.escribirMensaje('¡Gengar enemigo se debilitó! ¡Has ganado!');
        this.batalla.enBatalla = false;
        setTimeout(() => this.cambiarTab('games'), 3500);
      } else {
        this.turnoEnemigo();
      }
    }, 600);
  },

  curar() {
    if (!this.batalla.enBatalla) return;
    this.escribirMensaje(`¡Usaste una Poción Máxima!`);
    setTimeout(() => {
      this.batalla.pHP += 50;
      if (this.batalla.pHP > 100) this.batalla.pHP = 100;
      this.actualizarBarras();
      this.turnoEnemigo();
    }, 1000);
  },

  turnoEnemigo() {
    setTimeout(() => {
      this.escribirMensaje('¡Gengar usó Bola Sombra!');
      setTimeout(() => {
        this.animarDanio('player-sprite');
        this.batalla.pHP -= Math.floor(Math.random() * 20) + 15; // Daño entre 15 y 35
        if (this.batalla.pHP < 0) this.batalla.pHP = 0;
        this.actualizarBarras();
        
        if (this.batalla.pHP === 0) {
          this.escribirMensaje('¡Tu Pokémon se debilitó! Perdiste la batalla.');
          this.batalla.enBatalla = false;
          setTimeout(() => this.cambiarTab('games'), 3500);
        } else {
          setTimeout(() => this.escribirMensaje('¿Qué debería hacer tu Pokémon?'), 1000);
        }
      }, 600);
    }, 1800);
  }
};

window.app = app;
