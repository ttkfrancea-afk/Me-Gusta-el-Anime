import { supabase } from './supabase.js';

export const initQuizEngine = () => {
    let quizActive = false;
    let startTime = 0;
    const TIME_LIMIT = 10000; // 10 segundos

    const startQuiz = async (questionId) => {
        quizActive = true;
        startTime = performance.now();
        console.log('Quiz iniciado. Temporizador hardcore corriendo.');
        // Aquí iría la lógica del DOM para mostrar la pregunta.
    };

    const submitAnswer = async (answer) => {
        if (!quizActive) return;
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;

        if (elapsedTime > TIME_LIMIT) {
            failQuiz('Tiempo agotado. Límite estricto de 10s.');
            return;
        }
        
        console.log(`Respuesta enviada en ${elapsedTime}ms`);
        // Lógica de validación con Supabase aquí...
        quizActive = false;
    };

    const failQuiz = (reason) => {
        quizActive = false;
        alert(`❌ Fallaste: ${reason}`);
        // Registrar fallo en base de datos
    };

    // MOTOR ANTI-TRAMPAS: Detecta si cambia de pestaña o minimiza
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && quizActive) {
            failQuiz('Se detectó cambio de pestaña. Intento de trampa anulado.');
        }
    });

    // Exponer al DOM global si es necesario
    window.startHardcoreQuiz = startQuiz;
    window.submitHardcoreAnswer = submitAnswer;
};
