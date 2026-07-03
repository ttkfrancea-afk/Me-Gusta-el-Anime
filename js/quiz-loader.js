// =====================================================================
// OTAKU NEXUS · js/quiz-loader.js
// ---------------------------------------------------------------------
// Pestaña QUIZ: agrupa las preguntas por anime_id y pinta una tarjeta
// de acceso por cada quiz disponible (enlaza a quiz_template.html).
// =====================================================================

import { supabase } from './supabase.js';

export async function initQuiz() {
  const contenedor = document.getElementById('quiz-grid');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="feed-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando quizzes...</div>';

  const { data, error } = await supabase
    .from('preguntas_quiz')
    .select('anime_id, color_primario')
    .order('created_at', { ascending: false });

  if (error || !data) {
    contenedor.innerHTML = '<p class="feed-vacio">No se pudieron cargar los quizzes.</p>';
    return;
  }

  const animesUnicos = {};
  data.forEach((item) => {
    if (item.anime_id && !animesUnicos[item.anime_id]) {
      animesUnicos[item.anime_id] = { id: item.anime_id, color: item.color_primario || 'var(--color-accent-red)' };
    }
  });

  const listaFinal = Object.values(animesUnicos);
  if (listaFinal.length === 0) {
    contenedor.innerHTML = '<p class="feed-vacio">No hay quizzes disponibles aún.</p>';
    return;
  }

  contenedor.innerHTML = '';
  listaFinal.forEach((quiz) => {
    const titulo = quiz.id.charAt(0).toUpperCase() + quiz.id.slice(1);
    const tarjeta = document.createElement('div');
    tarjeta.className = 'game-card';
    tarjeta.innerHTML = `
      <div class="game-card__icon" style="border-color: ${escapeHTML(quiz.color)};">
        <i class="fa-solid fa-brain" style="color: ${escapeHTML(quiz.color)};"></i>
      </div>
      <div class="game-card__info">
        <h3>Quiz: ${escapeHTML(titulo)}</h3>
        <p>Demuestra tu conocimiento y gana puntos</p>
      </div>
      <i class="fa-solid fa-arrow-up-right-from-square" style="color: var(--color-accent-yellow);"></i>
    `;
    tarjeta.addEventListener('click', () => { window.location.href = `quiz_template.html?anime=${encodeURIComponent(quiz.id)}`; });
    contenedor.appendChild(tarjeta);
  });
}

function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
