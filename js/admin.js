import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Validar si es admin (Para simplificar, comprobamos correo específico o rol)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'admin@tudominio.com') { // Reemplaza con tu correo admin
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:50px;">ACCESO DENEGADO</h1>';
        return;
    }

    // Insertar Video
    document.getElementById('form-video').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = e.target.url.value;
        const category = e.target.category.value;
        await supabase.from('content').insert([{ youtube_url: url, category }]);
        alert('Video inyectado con éxito');
        e.target.reset();
    });

    // Actualizar Fondo
    document.getElementById('form-bg').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = e.target.bg_url.value;
        await supabase.from('config').upsert({ key_name: 'login_bg', image_url: url }, { onConflict: 'key_name' });
        alert('Fondo actualizado');
    });
});
