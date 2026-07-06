/* =========================================================
   ME GUSTA EL ANIME — js/auth-ui.js
   Responsabilidad única: alternar entre el panel de Login y
   el de Registro (botones desktop del overlay + enlaces mobile).
   Es exactamente la misma lógica que tenías en el <script>
   original de loginanime.html — solo que ahora, además, le
   avisa a la tómbola de fondo cuándo cambiaste de pestaña.
   ========================================================= */

(function () {
    const container = document.getElementById('container');
    const signUpBtnDesktop = document.getElementById('signUp');
    const signInBtnDesktop = document.getElementById('signIn');
    const signUpBtnMobile = document.getElementById('signUpMobile');
    const signInBtnMobile = document.getElementById('signInMobile');

    const activateSignUp = (e) => {
        if (e) e.preventDefault();
        if (container.classList.contains('right-panel-active')) return; // ya estaba activo
        container.classList.add('right-panel-active');

        if (window.FondoTombola) {
            window.FondoTombola.notificarCambioDePestana('register');
        }
    };

    const activateSignIn = (e) => {
        if (e) e.preventDefault();
        if (!container.classList.contains('right-panel-active')) return; // ya estaba activo
        container.classList.remove('right-panel-active');

        if (window.FondoTombola) {
            window.FondoTombola.notificarCambioDePestana('login');
        }
    };

    signUpBtnDesktop.addEventListener('click', activateSignUp);
    signInBtnDesktop.addEventListener('click', activateSignIn);
    signUpBtnMobile.addEventListener('click', activateSignUp);
    signInBtnMobile.addEventListener('click', activateSignIn);
})();
