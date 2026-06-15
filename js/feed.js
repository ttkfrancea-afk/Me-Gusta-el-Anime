import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const feedContainer = document.getElementById('feed-container');
    const prizesContainer = document.getElementById('prizes-container');

    // Cargar Premios
    const loadPrizes = async () => {
        const { data } = await supabase.from('prizes').select('*').order('place', { ascending: true });
        if(data) {
            prizesContainer.innerHTML = data.map(p => `
                <div class="glass-panel prize-card">
                    <h3>Top ${p.place}</h3>
                    <img src="${p.media_url}" alt="Premio ${p.place}">
                    <p>${p.description}</p>
                </div>
            `).join('');
        }
    };

    // Cargar Videos Transformando URL a Iframe Embed
    const loadFeed = async () => {
        const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false });
        if(data) {
            feedContainer.innerHTML = data.map(v => {
                // Convierte youtube.com/watch?v=ID a youtube.com/embed/ID
                const embedUrl = v.youtube_url.replace('watch?v=', 'embed/');
                return `
                <div class="glass-panel video-wrapper">
                    <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                `;
            }).join('');
        }
    };

    loadPrizes();
    loadFeed();
});
