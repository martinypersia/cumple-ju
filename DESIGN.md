# Design

## Visual Theme

**Mood:** la última hora de una fiesta de verano. El sol ya bajó, la bola de disco recién se prendió, el piso todavía guarda calor.

El sitio no tiene *una* estética: tiene cinco, una por era de Harry Styles, y cada una se queda con el viewport entero. La estrategia de color es **Drenched** en las cinco: la superficie *es* el color. Es la licencia que el registro brand habilita y que este proyecto necesita, porque el salto entre pantallas tiene que sentirse como cambiar de disco.

El arco va de cálido y analógico a nocturno y bailable: rosa profundo → fucsia eléctrico → celeste doméstico → negro de estadio → azul de anochecer con bola de disco. Terminar en la oscuridad es lo que hace que el botón del grupo se lea como entrar al after.

No se reproduce arte oficial de los álbumes. Cada era se traduce a paleta, tipografía, textura y movimiento.

## Color Palette

Todo en OKLCH. La semilla `oklch(0.42 0.163 350)` ancla la era de apertura; el resto rota alrededor de ella.

| Era | Rol | Valor |
|---|---|---|
| **0 · Harry Styles (2017)** | bg | `oklch(0.790 0.088 356)` agua rosa (el canvas va de `0.890` arriba a `0.790` abajo) |
| | ink | `oklch(0.270 0.095 8)` vino |
| | accent | `oklch(0.340 0.120 8)` vino, botón |
| **1 · Fine Line (2019)** | bg | `oklch(0.55 0.215 355)` fucsia |
| | ink | `oklch(0.99 0.012 350)` |
| | accent | `oklch(0.70 0.165 250)` azul eléctrico |
| **2 · Harry's House (2022)** | bg | `oklch(0.80 0.105 230)` celeste |
| | ink | `oklch(0.28 0.065 250)` azul tinta |
| | accent | `oklch(0.83 0.155 88)` amarillo |
| **3 · Harry's House · patio** | bg | `oklch(0.76 0.145 62)` naranja tostado |
| | ink | `oklch(0.26 0.070 40)` |
| | accent | `oklch(0.46 0.105 232)` azul profundo |
| **4 · Love On Tour** | bg | `oklch(0.155 0.035 320)` negro ciruela |
| | ink | `oklch(0.97 0.012 320)` |
| | accent | `oklch(0.75 0.185 350)` magenta / `oklch(0.83 0.130 88)` oro |
| **5 · Kiss All the Time (2026)** | bg | degradado `oklch(0.19 0.075 270)` → `oklch(0.33 0.125 322)` |
| | ink | `oklch(0.98 0.010 300)` |
| | accent | `oklch(0.75 0.190 350)` rosa / `oklch(0.82 0.115 200)` cian |

Cada paleta se verifica a ≥4.5:1 en cuerpo y ≥3:1 en títulos grandes. La era 2 y la 3 son claras a propósito: sin ese respiro, cinco pantallas saturadas seguidas cansan y la última deja de impactar.

## Typography

Tres familias, tres roles distintos. Ninguna de la lista de reflejo.

- **Display — Bricolage Grotesque** (variable: `wght` 200-800, `wdth` 75-100, `opsz`). Grotesca con carácter raro, ni neutra ni disfrazada. El eje de ancho se mueve *por era*: comprimida en la portada, expandida en la bola de disco. Que la tipografía cambie de forma al avanzar es parte del efecto.
- **Cuerpo — Figtree** (variable `wght`). Alta altura-x, impecable en pantalla chica, legible sobre fondos saturados.
- **Datos — Chivo Mono.** Solo para fecha, hora y dirección, tratados como el troquelado de una entrada de recital. El mono acá no es disfraz de "técnico": es objeto físico, el ticket.

Escala fluida con `clamp()`, razón 1.3 entre pasos. Techo de display 6rem. `text-wrap: balance` en títulos.

## Motion

El movimiento es el argumento del proyecto, no la decoración.

- **Agua rosa.** La portada presenta a Juli como si sacara su disco homónimo, igual que Harry en 2017. El fondo es una simulación de ondas en tiempo real (dos buffers de altura, en baja resolución y escalada por el navegador) que responde al dedo y, con la música sonando, a los graves. El botón "Meterse al agua" es el gesto que el navegador exige para reproducir audio, y tira un chapuzón grande: la restricción técnica convertida en momento. Los topes de brillo y valle del agua están calculados para que el texto encima pase AA en el valle más oscuro.
- **Reactivo al audio.** Un `AnalyserNode` de la Web Audio API lee el MP3 en vivo y alimenta el pulso de la bola de disco y el latido de los reflectores. Si no hay archivo de audio, un oscilador de respaldo genera la misma energía para que nada se vea muerto.
- **Transición entre eras.** Fundido cruzado de 620ms con `ease-out-expo`, con el color de fondo del documento interpolando en paralelo. El contenido entrante entra escalonado.
- **Odómetro.** La cuenta regresiva rueda por columnas de dígitos, no parpadea.
- **Reflector.** En Love On Tour la luz sigue al puntero; en táctil barre sola.

`prefers-reduced-motion` reemplaza todo por fundidos de opacidad y estados fijos. Nada de información vive solo en el movimiento.

## Layout

- Seis vistas a pantalla completa, todas en el DOM, una con `is-active`.
- `100dvh`, nunca `100vh`.
- Áreas táctiles de 44px mínimo.
- Móvil primero: el escritorio es el caso raro, no al revés.
- Navegación por botón, deslizamiento y flechas del teclado. Indicador de progreso de seis puntos, el activo se alarga.

## Components

- `era` — sección a pantalla completa que aplica su paleta al documento al activarse.
- `agua` — canvas de ondas en tiempo real (`js/water.js`); el botón de la portada dispara el audio.
- `odometro` — cuenta regresiva por columnas.
- `lente` — composición circular con texto curvo en `textPath`, para Fine Line.
- `reflector` — máscara de gradiente radial que sigue al puntero.
- `bola-disco` — canvas de puntos de luz reactivo al audio.
- `galeria` — scroll horizontal con `scroll-snap`.
- `ticket` — bloque de datos en mono con troquelado.
