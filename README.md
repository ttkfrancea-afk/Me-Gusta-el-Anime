# 🦊 OTAKU NEXUS — Guía de Instalación (Mentor Mode)

¡Felicidades! Aquí tienes el proyecto **completo**: las 6 tablas de
Supabase, las 3 páginas (`index.html`, `dashboard.html`, `admin.html`)
y todo el CSS/JS modularizado tal como pediste en la arquitectura de
carpetas.

Esta guía te lleva, **paso a paso**, desde "tengo los archivos" hasta
"mi app funciona en internet". Sigue el orden, no te saltes pasos.

```
otaku-nexus/
├── assets/                 <- pon aquí íconos/logos propios (opcional)
├── css/
│   ├── variables.css       <- paleta de colores, fuentes, reset
│   ├── login.css            <- split panel del login
│   ├── dashboard.css        <- feed, premios, quiz
│   └── admin.css            <- panel privado
├── js/
│   ├── supabase.js          <- 🔑 AQUÍ van tus llaves de Supabase
│   ├── auth.js               <- login / registro / verificación
│   ├── feed.js                <- premios + feed de YouTube
│   ├── quiz.js                <- motor anti-trampas
│   └── admin.js               <- CMS del panel privado
├── index.html               <- Login / Registro
├── dashboard.html            <- Plataforma principal
├── admin.html                 <- CMS privado
├── schema.sql                  <- PASO 1: tablas de Supabase
├── seed_preguntas.sql           <- (opcional) 10 preguntas de prueba
└── README.md                     <- este archivo
```

---

## PASO 1 — Crear el proyecto en Supabase y correr el SQL

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto
   nuevo (elige una contraseña de base de datos y guárdala).
2. En el menú lateral, abre **SQL Editor → New query**.
3. Abre el archivo `schema.sql` de este proyecto, **copia TODO su
   contenido** y pégalo en el editor. Dale **RUN**.
   - Esto crea las 6 tablas: `usuarios`, `configuracion`, `contenido`,
     `premios`, `quizzes`, `intentos_quiz`, además del trigger que
     crea automáticamente el perfil cuando alguien se registra y la
     función `responder_pregunta()` (el cerebro del anti-trampas).
4. **(Opcional pero recomendado para probar)**: abre
   `seed_preguntas.sql`, cópialo y dale RUN también. Esto llena el
   quiz de HOY con 10 preguntas de ejemplo para que puedas probar la
   plataforma sin tener que escribir preguntas a mano todavía.

> 💡 **¿Cómo se relacionan las tablas?** `usuarios` es tu "perfil
> público" y está conectado 1 a 1 con el sistema de login de Supabase
> (`auth.users`). `intentos_quiz` conecta `usuarios` con `quizzes`
> (cada fila = "este usuario respondió esta pregunta este día").
> `configuracion`, `contenido` y `premios` son tablas independientes
> que solo leen el index/dashboard y solo escribe el admin.

---

## PASO 2 — Configurar la autenticación (verificación por correo)

El brief pide que, si el usuario no verifica su correo, no pueda
entrar. Esto **ya viene activado por defecto** en Supabase, pero
revisa esto para que los links de los correos funcionen bien:

1. Ve a **Authentication → URL Configuration**.
2. En **Site URL**, pon la URL donde vivirá tu app. Mientras
   desarrollas localmente puede ser `http://localhost:3000` (o el
   puerto que uses). Cuando subas a Vercel, cámbiala a tu dominio real
   (ej. `https://otaku-nexus.vercel.app`).
3. En **Redirect URLs**, agrega también esa misma URL + `/index.html`
   (ej. `https://otaku-nexus.vercel.app/index.html`). Esto es a donde
   te manda el correo de "olvidé mi contraseña".
4. (Opcional) En **Authentication → Email Templates** puedes editar el
   texto del correo de confirmación con tu marca "Otaku Nexus".

No necesitas tocar nada más: `auth.js` ya está programado para
detectar el error `"Email not confirmed"` y mostrar la alerta amarilla
exacta que pediste.

---

## PASO 3 — Pegar tus llaves de Supabase (la parte "novato")

1. En tu proyecto de Supabase, ve a **Settings → API**.
2. Vas a ver dos valores que necesitas:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public** key (un texto larguísimo)
3. Abre el archivo `js/supabase.js` en tu editor de código.
4. Busca estas dos líneas casi al principio del archivo:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';
```

5. Reemplaza los valores de ejemplo con los TUYOS (entre comillas,
   sin borrar las comillas). Guarda el archivo.

¡Eso es todo! Como `supabase.js` exporta el cliente `supabase`, **todos**
los demás archivos (`auth.js`, `feed.js`, `quiz.js`, `admin.js`) ya
quedan conectados automáticamente porque hacen
`import { supabase } from './supabase.js'`. No tienes que repetir las
llaves en ningún otro lugar — esa es la ventaja de modularizar.

---

## PASO 4 — Correr el proyecto en tu computadora

⚠️ Importante: como usamos `<script type="module">` (ES6 Modules), **no
puedes** abrir `index.html` haciendo doble clic (protocolo `file://`).
Los navegadores bloquean los módulos por seguridad. Necesitas un
servidor local sencillo:

**Opción A — VS Code:**
Instala la extensión "Live Server", clic derecho sobre `index.html` →
"Open with Live Server".

**Opción B — Node.js (si lo tienes instalado):**
```bash
npx serve .
```
y abre la URL que te indique (ej. `http://localhost:3000`).

---

## PASO 5 — Crear tu usuario Administrador

1. Con el proyecto corriendo, ve a `index.html` y **regístrate
   normalmente** con el correo que quieras usar como administrador.
2. Verifica ese correo (haz clic en el enlace que te llega).
3. Vuelve al **SQL Editor** de Supabase y corre esto (cambia el
   correo por el tuyo):

```sql
update public.usuarios
set es_admin = true
where id = (select id from auth.users where email = 'tu-correo-admin@ejemplo.com');
```

4. Ahora entra a `admin.html` (URL discreta, no está enlazada desde
   ningún menú visible — esa es la "puerta secreta"). Si tu cuenta
   tiene `es_admin = true`, verás el panel completo. Cualquier otra
   cuenta verá la pantalla "403 - Acceso Denegado".

---

## PASO 6 — Cargar contenido desde el panel admin

Desde `admin.html` (logueado como admin) puedes:

- **Banners**: pega URLs de imágenes (posters de anime subidos a
  cualquier hosting de imágenes que tú controles) para el fondo del
  login. Se rotan automáticamente cada 6 segundos.
- **Videos**: pega el link completo de YouTube (acepta
  `youtube.com/watch?v=...`, `youtu.be/...`, `shorts/...` o solo el ID
  de 11 caracteres) + una categoría. Aparecen como `<iframe>` en el
  feed del dashboard, filtrables por categoría.
- **Premios**: edita título, descripción e imagen/video de los 3
  lugares del torneo.

---

## PASO 7 — Preguntas del Quiz para "el día de hoy"

`quiz.js` busca filas en `quizzes` donde `fecha_activa = HOY`. Tienes
dos formas de mantener esto actualizado cada día:

**Manual (gratis, cualquier plan):** cada día, en el SQL Editor:
```sql
update public.quizzes set fecha_activa = current_date
where id in (
  select id from public.quizzes
  where fecha_activa is distinct from current_date
  order by random()
  limit 10
);
```

**Automático (requiere extensión `pg_cron`):** al final de
`schema.sql` dejé el código comentado listo para programar esto a las
05:00 UTC todos los días. Solo descomenta y corre ese bloque una vez.

---

## PASO 8 — Subir a GitHub + Vercel

1. Crea un repositorio nuevo en GitHub y sube TODA la carpeta
   `otaku-nexus` (incluyendo `js/supabase.js` ya con tus llaves —
   recuerda, la `anon key` es pública por diseño, no es un secreto).
2. Entra a [vercel.com](https://vercel.com) → **Add New Project** →
   importa tu repositorio de GitHub.
3. Como es un proyecto 100% HTML/CSS/JS estático, Vercel lo detecta
   solo: no necesitas configurar "Build Command" ni "Output
   Directory" (déjalos vacíos / "Other").
4. Dale **Deploy**. Cuando termine, copia la URL que te da Vercel
   (ej. `https://otaku-nexus.vercel.app`) y vuelve al **PASO 2** para
   actualizar el **Site URL** y **Redirect URLs** en Supabase con esa
   URL real.

---

## Resumen del "anti-trampas" (por si quieres explicarlo a otros)

1. Cuando se muestra una pregunta, se inserta una fila en
   `intentos_quiz` con `mostrado_en = now()` — ese reloj es del
   **servidor de Supabase**, no del navegador.
2. Si el usuario cambia de pestaña (`document.visibilityState ===
   'hidden'`), `quiz.js` envía de inmediato la respuesta como
   "trampa detectada" — sin esperar nada.
3. Cuando el usuario responde (o se acaba el tiempo visual), se llama
   a la función SQL `responder_pregunta()`, que vuelve a calcular
   `now() - mostrado_en` **en el servidor**. Si pasaron más de 10
   segundos reales, o si llegó la bandera de trampa, la respuesta se
   marca como incorrecta sin importar lo que haya elegido el usuario.

Esto hace que **modificar el JavaScript del navegador** (con las
DevTools, por ejemplo) no sirva para hacer trampa: la decisión final
nunca sale del cliente.

---

¿Listo para seguir? Si quieres, en la próxima conversación podemos
trabajar en mejoras como: ranking semanal/mensual, página de perfil de
usuario, notificaciones push, o un editor de preguntas más visual
dentro de `admin.html`. ¡Mucho éxito con Otaku Nexus! 🥷
