# Una fiesta en cinco eras

Invitación de cumpleaños: un recorrido de seis pantallas, una por era de Harry Styles, que termina desbloqueando el link del grupo de WhatsApp. Entrar al grupo es la confirmación de asistencia.

Sitio estático: HTML, CSS y JavaScript, sin build ni dependencias en producción.

---

## Lo que falta cargar

Todo lo editable vive en **`js/config.js`**. Es el único archivo que necesitás tocar.

| Campo | Qué va |
|---|---|
| `nombre` | Nombre de la cumpleañera o cumpleañero |
| `edad` | Un número, o `null` para no mostrarla |
| `fecha` | Fecha y hora en ISO con huso horario: `"2026-11-14T22:00:00-03:00"` |
| `horaFin` | Texto libre |
| `lugar.nombre` / `lugar.direccion` | Dónde es |
| `lugar.mapsUrl` | Link de Google Maps. Si lo dejás vacío, el botón busca por dirección |
| `lugar.nota` | Estacionamiento, timbre, cómo entrar |
| `whatsappGrupo` | `https://chat.whatsapp.com/...` |
| `audio` | Nombre del MP3 dentro de `assets/audio/` |
| `fotos` | Lista de fotos (ver abajo) |
| `fotoPrincipal` | La que va adentro del círculo de la segunda pantalla |
| `chistes` | Cinco huecos para referencias internas. Vacíos usan el texto de fábrica |

Mientras falten datos, la invitación funciona igual y muestra placeholders visibles. Nada rompe.

---

## Música

Dejá el MP3 en `assets/audio/` y poné su nombre en `config.js`.

El navegador **no permite** que el audio arranque solo: necesita un gesto de la persona. Ese gesto es el botón "Meterse al agua" de la primera pantalla (también sirven la flecha derecha y los puntos de abajo). Si el archivo no existe o falla, el recorrido sigue funcionando en silencio y los efectos visuales pasan a un latido sintético.

Exportá el tema en 128 kbps mono o 160 kbps estéreo. Tres minutos así pesan unos 3 MB, que es lo máximo razonable para que cargue rápido con datos móviles.

---

## Fotos

1. Dejá las fotos originales en `assets/fotos/`.
2. `npm install` (una sola vez, instala `sharp`).
3. `npm run fotos`

El script redimensiona a 1400px, convierte a WebP, deja los originales intactos, escribe las versiones optimizadas en `assets/fotos/web/` y te imprime el array listo para pegar en `config.js`. También lo guarda en `assets/fotos/lista-para-config.txt`.

Después completá cada `alt` con una descripción corta: se lee en voz alta y aparece si la imagen no carga.

**Fotos de iPhone:** si están en HEIC, exportalas como JPG antes (en Fotos: Compartir → Opciones → Formato: Más compatible). El script te avisa si encuentra HEIC.

---

## Ver la invitación mientras la editás

```bash
npm run dev
```

Abre `http://localhost:4321`. Hace falta un servidor porque el código usa módulos ES: abrir `index.html` con doble clic no funciona.

---

## Publicar en Vercel

```bash
npx vercel login     # una sola vez, es interactivo
npx vercel           # deploy de prueba, devuelve una URL
npm run deploy       # deploy definitivo (vercel --prod)
```

La URL de producción es la que mandás por WhatsApp.

**Importante:** `assets/` está en el `.gitignore`, así que la música y las fotos **no están en GitHub**. Si conectás Vercel al repositorio para que deploye solo en cada push, el sitio publicado sale sin música ni fotos. Deployá con `npm run deploy` desde esta carpeta: sube los archivos locales, `assets/` incluido.

### La imagen de preview

WhatsApp muestra una tarjeta con imagen cuando se comparte un link. Para que aparezca faltan dos cosas:

1. Crear `assets/og.jpg` de 1200×630 px (una foto linda con el nombre encima sirve).
2. En `index.html`, cambiar `og:image` por la **URL absoluta** una vez que sepas el dominio:
   ```html
   <meta property="og:image" content="https://tu-dominio.vercel.app/assets/og.jpg">
   ```
   WhatsApp no resuelve rutas relativas.

Sin esto el link se comparte igual, pero sin imagen.

---

## Cómo está armado

```
index.html          las seis pantallas
css/base.css        reset, tokens, layout del recorrido, tipografía
css/eras.css        una paleta y un mundo visual por era
js/config.js        los datos de la fiesta
js/app.js           navegación, cuenta regresiva, galería, luces
js/audio.js         reproducción, silencio y análisis de frecuencias
js/water.js         la simulación de agua de la portada
scripts/fotos.mjs   optimiza las fotos y arma la lista
scripts/contraste.mjs  verifica el contraste de las paletas (WCAG AA)
```

Las seis pantallas están todas en el DOM; una sola tiene la clase `is-active`. Al cambiar de era, `data-era` en el `<body>` cambia la paleta entera del documento y el fondo interpola.

`node scripts/contraste.mjs` verifica que las cinco paletas cumplan WCAG AA. Corrélo si tocás algún color.

### Detalles que importan

- **Movimiento reducido:** con `prefers-reduced-motion` activado el agua queda quieta y se apagan la lente, el reflector, el pulso de la bola de disco y la animación del odómetro. No se pierde información.
- **Navegación:** botón, deslizamiento, flechas izquierda y derecha, y los puntos de abajo.
- **Fecha pasada:** la cuenta regresiva no muestra números negativos; cambia el mensaje.
- **Sin JavaScript:** se ve la primera pantalla completa.
