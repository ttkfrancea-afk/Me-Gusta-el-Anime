import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica del Slider
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const alertBox = document.getElementById('alert-box');

    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });

    // 2. Motor de partículas de fondo (Brasas Ardientes intacto)
    const canvas = document.getElementById('canvas-particles');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * -0.5 - 0.2;
            this.color = Math.random() > 0.5 ? '#ff3131' : '#555';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) particlesArray.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();

    // 3. Conexión con Supabase (Registro e Inicio de Sesión)
    function showAlert(msg, isVerification = false) {
        if (isVerification) {
            alertBox.innerHTML = `
                <div>${msg}</div>
                <ol>
                    <li><strong>Verifica:</strong> Revisa tu correo electrónico y confirma la cuenta desde el enlace recibido.</li>
                    <li><strong>Gmail:</strong> Entra a tu bandeja de entrada si el sistema te redirige allí.</li>
                    <li><strong>Acceso:</strong> Inicia sesión con tu correo y clave en la plataforma.</li>
                    <li><strong>Disfruta:</strong> Ingresa y Disfruta de "Me Gusta el Anime".</li>
                </ol>
            `;
        } else {
            alertBox.textContent = msg;
        }
        
        alertBox.style.display = 'block';
        setTimeout(() => alertBox.style.display = 'none', 10000);
    }

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
            container.classList.remove('right-panel-active');
            e.target.reset();
        }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                showAlert('Verifica tu correo electrónico:', true);
            } else {
                showAlert('Credenciales inválidas');
            }
        } else {
            window.location.href = 'dashboard.html';
        }
    });
});
