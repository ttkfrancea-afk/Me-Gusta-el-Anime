import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('split-wrapper');
    const alertBox = document.getElementById('alert-box');

    // UI Toggles
    signUpButton.addEventListener('click', () => container.classList.add('right-panel-active'));
    signInButton.addEventListener('click', () => container.classList.remove('right-panel-active'));

    // Cargar fondo dinámico desde Supabase (Tabla config)
    const loadDynamicBg = async () => {
        const { data, error } = await supabase.from('config').select('image_url').eq('key_name', 'login_bg').single();
        if (data && data.image_url) {
            document.getElementById('dynamic-bg').style.backgroundImage = `url('${data.image_url}')`;
        }
    };
    loadDynamicBg();

    // Lógica de Registro
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPass = e.target.confirm_password.value;
        const country = e.target.country.value;

        if (password !== confirmPass) {
            showAlert('Las contraseñas no coinciden');
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { country_code: country } }
        });

        if (error) showAlert(error.message);
        else {
            showAlert('¡Registro exitoso! Por favor, verifica tu correo antes de entrar.');
            container.classList.remove('right-panel-active'); // Volver al login
        }
    });

    // Lógica de Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                showAlert('Verifica tu correo electrónico siguiendo los pasos 1, 2, 3 y 4 antes de ingresar');
            } else {
                showAlert('Credenciales inválidas');
            }
        } else {
            window.location.href = 'dashboard.html';
        }
    });

    // Función de alerta
    function showAlert(msg) {
        alertBox.textContent = msg;
        alertBox.classList.add('show');
        setTimeout(() => alertBox.classList.remove('show'), 5000);
    }
});
