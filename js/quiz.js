// =====================================================================
// OTAKU NEXUS · js/quiz.js
// ---------------------------------------------------------------------
// MOTOR DE QUIZ ANTI-TRAMPAS
//
// Reglas de oro de este archivo:
//   - El temporizador visual (la barra) es SOLO decoración. NUNCA
//     decide si una respuesta es correcta.
//   - La verdad absoluta vive en la función SQL responder_pregunta()
//     (ver schema.sql), que usa el reloj del SERVIDOR.
//   - Si el usuario cambia de pestaña / minimiza (document.
//     visibilityState === 'hidden') mientras hay una pregunta activa
//     sin responder, esa pregunta se reporta INMEDIATAMENTE como
//     "trampa" y se marca fallida sin posibilidad de apelación.
//
// Flujo general:
//   1. Revisamos si el usuario ya completó el quiz de HOY.
//   2. Si no, traemos las preguntas activas de hoy (fecha_activa).
//   3. Para la pregunta actual: insertamos (o recuperamos) su fila en
//      "intentos_quiz" -> el servidor nos devuelve "mostrado_en".
//   4. Mostramos la pregunta y arrancamos la barra de 10 segundos
//      basada en "mostrado_en".
//   5. Al responder (clic, timeout o trampa) llamamos a la función
//      RPC responder_pregunta() y mostramos el resultado real.
//   6. Repetimos hasta terminar las 10 preguntas y mostramos el
//      puntaje final del día.
// =====================================================================

import { supabase } from './supabase.js';

const LIMITE_SEGUNDOS = 10;

// ---------------------------------------------------------------------
// REFERENCIAS AL DOM (deben existir en dashboard.html)
// ---------------------------------------------------------------------
const quizCard = document.getElementById('quiz-card');
const quizProgreso = document.getElementById('quiz-progreso');
const quizTimerBarra = document.getElementById('quiz-timer-barra');
const quizPreguntaTexto = document.getElementById('quiz-pregunta-texto');
const quizOpciones = document.getElementById('quiz-opciones');
const quizFeedback = document.getElementById('quiz-feedback');
const quizFinal = document.getElementById('quiz-final');
const quizFinalPuntaje = document.getElementById('quiz-final-puntaje');

// ---------------------------------------------------------------------
// ESTADO INTERNO DEL MOTOR
// ---------------------------------------------------------------------
let preguntasDeHoy = [];   // array de filas de "quizzes" para fecha_activa = hoy
let intentosDeHoy = [];    // array de filas de "intentos_quiz" ya existentes hoy
let indiceActual = 0;      // índice (0-9) de la pregunta que se está mostrando
let intentoActualId = null;     // id (uuid) de la fila intentos_quiz actual
let mostradoEnTimestamp = null; // Date con el "mostrado_en" que devolvió el servidor
let respondida = false;         // evita doble envío de la misma pregunta
let intervaloTimer = null;      // referencia al setInterval de la barra
let usuarioId = null;
let fechaHoy = null;            // 'YYYY-MM-DD', calculada una vez al iniciar

// =====================================================================
// PUNTO DE ENTRADA
// =====================================================================
export async function iniciarQuiz() {
  if (!quizCard) return; // esta página no tiene el bloque de quiz

  const { data: sesionData } = await supabase.auth.getSession();
  const sesion = sesionData.session;
  if (!sesion) return; // dashboard.js ya redirige si no hay sesión, esto es por seguridad
  usuarioId = sesion.user.id;

  // 1) Traer las preguntas activas para HOY
  fechaHoy = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const { data: preguntas, error: errPreguntas } = await supabase
    .from('quizzes')
    .select('id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, categoria')
    .eq('fecha_activa', fechaHoy)
    .order('id', { ascending: true });

  if (errPreguntas) {
    console.error('Error cargando preguntas del quiz:', errPreguntas.message);
    mostrarSinQuiz('No se pudo cargar el quiz de hoy. Intenta más tarde.');
    return;
  }

  if (!preguntas || preguntas.length === 0) {
    mostrarSinQuiz('Todavía no hay preguntas configuradas para el día de hoy. ¡Vuelve más tarde!');
    return;
  }

  preguntasDeHoy = preguntas;

  // 2) Traer los intentos que ya existan hoy para este usuario (por si
  //    recargó la página a mitad del quiz)
  const { data: intentos, error: errIntentos } = await supabase
    .from('intentos_quiz')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('fecha', fechaHoy);

  if (errIntentos) {
    console.error('Error cargando intentos de hoy:', errIntentos.message);
  }
  intentosDeHoy = intentos || [];

  // 3) ¿Ya respondió TODAS las preguntas de hoy?
  const respondidas = intentosDeHoy.filter((i) => i.respondido_en !== null);
  if (respondidas.length >= preguntasDeHoy.length) {
    mostrarPantallaFinal();
    return;
  }

  // 4) Empezamos en la primera pregunta que NO tenga "respondido_en"
  indiceActual = respondidas.length;
  mostrarPreguntaActual();
}

// =====================================================================
// MOSTRAR LA PREGUNTA ACTUAL
// =====================================================================
async function mostrarPreguntaActual() {
  respondida = false;
  limpiarFeedback();

  const pregunta = preguntasDeHoy[indiceActual];
  if (!pregunta) {
    mostrarPantallaFinal();
    return;
  }

  // Actualizamos el contador "Pregunta X/10"
  if (quizProgreso) {
    quizProgreso.textContent = `Pregunta ${indiceActual + 1}/${preguntasDeHoy.length}`;
  }

  // ¿Ya existe una fila de intento para esta pregunta hoy (sin
  // responder)? Si sí, la reutilizamos para no perder el
  // "mostrado_en" original (esto evita que recargar la página
  // reinicie el cronómetro real).
  let intentoExistente = intentosDeHoy.find(
    (i) => i.quiz_id === pregunta.id && i.respondido_en === null
  );

  if (!intentoExistente) {
    // Insertamos una fila nueva. El servidor pone "mostrado_en = now()"
    // automáticamente (ver schema.sql) y nos la devuelve con .select().
    const { data, error } = await supabase
      .from('intentos_quiz')
      .insert({ usuario_id: usuarioId, quiz_id: pregunta.id })
      .select()
      .single();

    if (error) {
      // Código '23505' = violación de la restricción UNIQUE
      // (usuario_id, quiz_id, fecha). Esto puede pasar si la misma
      // pregunta ya se registró desde otra pestaña/dispositivo. En
      // ese caso, en vez de fallar, recuperamos la fila existente.
      if (error.code === '23505') {
        const { data: existente, error: errExistente } = await supabase
          .from('intentos_quiz')
          .select('*')
          .eq('usuario_id', usuarioId)
          .eq('quiz_id', pregunta.id)
          .eq('fecha', fechaHoy)
          .single();

        if (errExistente || !existente) {
          console.error('No se pudo recuperar el intento existente:', errExistente?.message);
          mostrarSinQuiz('Ocurrió un error iniciando la pregunta. Recarga la página.');
          return;
        }

        intentoExistente = existente;
        intentosDeHoy.push(intentoExistente);

        // Si esa pregunta ya fue respondida desde la otra pestaña,
        // saltamos directamente a la siguiente.
        if (intentoExistente.respondido_en !== null) {
          indiceActual += 1;
          mostrarPreguntaActual();
          return;
        }
      } else {
        console.error('Error registrando el intento:', error.message);
        mostrarSinQuiz('Ocurrió un error iniciando la pregunta. Recarga la página.');
        return;
      }
    } else {
      intentoExistente = data;
      intentosDeHoy.push(intentoExistente);
    }
  }

  intentoActualId = intentoExistente.id;
  mostradoEnTimestamp = new Date(intentoExistente.mostrado_en);

  // Pintamos el texto de la pregunta y las 4 opciones
  quizPreguntaTexto.textContent = pregunta.pregunta;

  quizOpciones.innerHTML = '';
  const opciones = [
    { letra: 'a', texto: pregunta.opcion_a },
    { letra: 'b', texto: pregunta.opcion_b },
    { letra: 'c', texto: pregunta.opcion_c },
    { letra: 'd', texto: pregunta.opcion_d },
  ];

  opciones.forEach((opcion) => {
    const boton = document.createElement('button');
    boton.className = 'quiz-opcion';
    boton.dataset.letra = opcion.letra;
    boton.innerHTML = `<span class="letra">${opcion.letra.toUpperCase()}</span> <span>${escapeHTML(opcion.texto)}</span>`;
    boton.addEventListener('click', () => responderPregunta(opcion.letra, false));
    quizOpciones.appendChild(boton);
  });

  // Si el tiempo del servidor ya venció (ej: el usuario dejó la
  // pestaña abierta cargando), forzamos el envío inmediato como
  // "tiempo agotado" sin esperar más.
  const segundosYaPasados = (Date.now() - mostradoEnTimestamp.getTime()) / 1000;
  if (segundosYaPasados >= LIMITE_SEGUNDOS) {
    responderPregunta(null, false);
    return;
  }

  iniciarBarraDeTiempo();
}

// =====================================================================
// BARRA DE TIEMPO (SOLO VISUAL)
// =====================================================================
function iniciarBarraDeTiempo() {
  detenerBarraDeTiempo();

  quizTimerBarra.style.width = '100%';
  quizTimerBarra.classList.remove('urgente');

  intervaloTimer = setInterval(() => {
    const transcurrido = (Date.now() - mostradoEnTimestamp.getTime()) / 1000;
    const restante = Math.max(0, LIMITE_SEGUNDOS - transcurrido);
    const porcentaje = (restante / LIMITE_SEGUNDOS) * 100;

    quizTimerBarra.style.width = `${porcentaje}%`;
    if (restante <= 3) {
      quizTimerBarra.classList.add('urgente');
    }

    // Tiempo agotado y la pregunta sigue sin respuesta -> auto-enviar
    if (restante <= 0 && !respondida) {
      responderPregunta(null, false);
    }
  }, 100);
}

function detenerBarraDeTiempo() {
  if (intervaloTimer) {
    clearInterval(intervaloTimer);
    intervaloTimer = null;
  }
}

// =====================================================================
// DETECCIÓN DE TRAMPA: CAMBIO DE PESTAÑA / MINIMIZAR
// =====================================================================
// "implacable": apenas el navegador reporta que la pestaña dejó de
// estar visible y hay una pregunta activa sin responder, se envía de
// inmediato como trampa. No importa si el usuario "vuelve rápido".
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && intentoActualId && !respondida) {
    responderPregunta(null, true);
  }
});

// =====================================================================
// ENVIAR RESPUESTA AL SERVIDOR (responder_pregunta RPC)
// =====================================================================
async function responderPregunta(letra, trampaDetectada) {
  if (respondida) return; // ya se procesó esta pregunta, ignoramos clics extra
  respondida = true;
  detenerBarraDeTiempo();

  // Deshabilitamos todos los botones para que no se pueda responder dos veces
  quizOpciones.querySelectorAll('.quiz-opcion').forEach((b) => (b.disabled = true));

  const { data, error } = await supabase.rpc('responder_pregunta', {
    p_intento_id: intentoActualId,
    p_respuesta: letra, // puede ser null si fue timeout/trampa
    p_trampa_detectada: trampaDetectada,
  });

  if (error) {
    console.error('Error validando la respuesta:', error.message);
    mostrarFeedback('Ocurrió un error de conexión al validar tu respuesta.', false);
  } else {
    // data viene como un array con una sola fila (es como funciona
    // "returns table" en supabase-js)
    const resultado = Array.isArray(data) ? data[0] : data;
    pintarResultadoEnBotones(letra, resultado.respuesta_correcta);

    if (trampaDetectada) {
      mostrarFeedback('¡Cambiaste de pestaña! Pregunta marcada como fallida.', false);
    } else if (resultado.es_correcta) {
      mostrarFeedback(`¡Correcto! +${resultado.puntos_obtenidos} puntos`, true);
    } else {
      mostrarFeedback('Incorrecto o fuera de tiempo.', false);
    }

    // Actualizamos en memoria para que mostrarPantallaFinal() tenga
    // datos frescos sin tener que volver a consultar la base.
    const intento = intentosDeHoy.find((i) => i.id === intentoActualId);
    if (intento) {
      intento.respondido_en = new Date().toISOString();
      intento.es_correcta = resultado.es_correcta;
      intento.puntos_obtenidos = resultado.puntos_obtenidos;
    }
  }

  // Avanzamos a la siguiente pregunta después de un breve respiro
  setTimeout(() => {
    indiceActual += 1;
    if (indiceActual >= preguntasDeHoy.length) {
      mostrarPantallaFinal();
    } else {
      mostrarPreguntaActual();
    }
  }, 1600);
}

// ---------------------------------------------------------------------
// Resalta visualmente cuál era la opción correcta y cuál escogió el
// usuario (si escogió alguna).
// ---------------------------------------------------------------------
function pintarResultadoEnBotones(letraElegida, letraCorrecta) {
  quizOpciones.querySelectorAll('.quiz-opcion').forEach((boton) => {
    if (boton.dataset.letra === letraCorrecta) {
      boton.classList.add('correcta');
    } else if (boton.dataset.letra === letraElegida) {
      boton.classList.add('incorrecta');
    }
  });
}

function mostrarFeedback(texto, ok) {
  quizFeedback.textContent = texto;
  quizFeedback.className = `quiz-feedback ${ok ? 'ok' : 'fail'}`;
}

function limpiarFeedback() {
  quizFeedback.textContent = '';
  quizFeedback.className = 'quiz-feedback';
}

// =====================================================================
// PANTALLA FINAL: PUNTAJE DEL DÍA
// =====================================================================
function mostrarPantallaFinal() {
  detenerBarraDeTiempo();

  const totalPosibles = preguntasDeHoy.length || intentosDeHoy.length || 10;
  const puntosHoy = intentosDeHoy.reduce((suma, i) => suma + (i.puntos_obtenidos || 0), 0);
  const correctasHoy = intentosDeHoy.filter((i) => i.es_correcta).length;

  // Ocultamos la zona de pregunta/opciones y mostramos el resumen
  document.getElementById('quiz-en-curso')?.classList.add('oculto');
  quizFinal.classList.remove('oculto');

  quizFinalPuntaje.textContent = `+${puntosHoy} pts`;
  const detalle = document.getElementById('quiz-final-detalle');
  if (detalle) {
    detalle.textContent = `Acertaste ${correctasHoy} de ${totalPosibles} preguntas hoy. ¡Vuelve mañana por más!`;
  }
}

function mostrarSinQuiz(mensaje) {
  document.getElementById('quiz-en-curso')?.classList.add('oculto');
  quizFinal.classList.remove('oculto');
  quizFinalPuntaje.textContent = '—';
  const detalle = document.getElementById('quiz-final-detalle');
  if (detalle) detalle.textContent = mensaje;
}

// ---------------------------------------------------------------------
// Utilidad: evitar inyección de HTML en el texto de las preguntas
// ---------------------------------------------------------------------
function escapeHTML(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Arrancamos el motor
iniciarQuiz();
