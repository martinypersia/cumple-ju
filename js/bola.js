/* ============================================================
   BOLA DE ESPEJOS — cuelga del techo de la portada, gira y tira
   reflejos por toda la pantalla.

   La esfera se dibuja faceta por faceta: cada espejito es un cuadrilátero
   sobre una grilla de latitud y longitud, con su normal. La luz entra
   arriba a la izquierda; cada faceta refleja el agua rosa si mira hacia
   abajo y el techo claro si mira hacia arriba, y destella cuando su
   reflejo apunta justo a la luz. Eso es lo que la hace ver en 3D.

   Los reflejos son puntos fijos sobre una esfera imaginaria alrededor de
   la bola; giran con ella y se proyectan sobre la pantalla. Van debajo
   del texto, así no le tocan el contraste.
   ============================================================ */

const VUELTA_MS = 14000;      // una vuelta completa
const INCLINACION = -0.32;    // rad, negativa: la vemos un poco desde abajo
const FRANJAS = 14;           // franjas de latitud
const POR_ECUADOR = 30;       // espejitos en la franja del medio
const REFLEJOS = 110;         // alrededor de un cuarto cae en pantalla a la vez

const LUZ = normalizar([-0.55, 0.65, 0.55]);
const COLOR = {
  junta:  [70, 34, 50],
  agua:   [233, 163, 188],    // lo que refleja hacia abajo: el agua de la portada
  techo:  [252, 238, 245],    // hacia arriba: luz clara
  lila:   [196, 176, 226],
};

function normalizar([x, y, z]) {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

// pseudoazar estable: cada espejito conserva su tono entre cuadros
function azar(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function crearBola(lienzo, capaReflejos, { reducido = false, energia = null } = {}) {
  const ctx = lienzo.getContext("2d");
  const rctx = capaReflejos.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let lado = 0, R = 0, cx = 0, cy = 0;
  let W = 0, H = 0, bx = 0, by = 0;
  let activo = false;
  let raf = null;
  const t0 = performance.now();

  // --- la grilla de espejitos, calculada una vez ---
  const espejos = [];
  for (let f = 0; f < FRANJAS; f++) {
    const lat0 = -Math.PI / 2 + (Math.PI * f) / FRANJAS;
    const lat1 = lat0 + Math.PI / FRANJAS;
    const n = Math.max(4, Math.round(POR_ECUADOR * Math.cos((lat0 + lat1) / 2)));
    for (let k = 0; k < n; k++) {
      const lon0 = (2 * Math.PI * k) / n;
      espejos.push({ lat0, lat1, lon0, lon1: lon0 + (2 * Math.PI) / n, tono: azar(f * 97 + k) });
    }
  }

  // --- los reflejos, repartidos alrededor ---
  const puntos = Array.from({ length: REFLEJOS }, (_, i) => ({
    lon: azar(i + 500) * Math.PI * 2,
    // la bola está arriba: casi todos los reflejos caen hacia abajo
    lat: -0.35 + azar(i + 900) * 1.55,
    tam: 0.6 + azar(i + 1300) * 0.9,
    color: azar(i + 1700) < 0.6 ? 0 : azar(i + 2100) < 0.6 ? 1 : 2,
    fase: azar(i + 2500) * Math.PI * 2,
  }));

  // un punto de luz suave por color; se estira con drawImage
  const sprites = ["255,255,255", "255,236,246", "226,214,255"].map((rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    // núcleo nítido y halo corto: un reflejo de espejo, no una mancha
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.45, `rgba(${rgb},1)`);
    grad.addColorStop(0.62, `rgba(${rgb},0.45)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  });

  function medir() {
    lado = lienzo.clientWidth;
    lienzo.width = lienzo.height = Math.round(lado * dpr);
    R = lado * 0.46;
    cx = lado / 2;
    cy = lado * 0.53;

    W = capaReflejos.clientWidth || window.innerWidth;
    H = capaReflejos.clientHeight || window.innerHeight;
    capaReflejos.width = Math.round(W * dpr);
    capaReflejos.height = Math.round(H * dpr);

    const r = lienzo.getBoundingClientRect();
    const rc = capaReflejos.getBoundingClientRect();
    bx = r.left - rc.left + cx;
    by = r.top - rc.top + cy;
  }

  // de la esfera a la pantalla: giro sobre el eje vertical y luego inclinación
  function punto(lat, lon, giro) {
    const cl = Math.cos(lat);
    const x = cl * Math.sin(lon + giro);
    const y = Math.sin(lat);
    const z = cl * Math.cos(lon + giro);
    const ci = Math.cos(INCLINACION), si = Math.sin(INCLINACION);
    return [x, y * ci - z * si, y * si + z * ci];
  }

  function pintarBola(giro, e) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lado, lado);

    // casquillo de donde cuelga
    const ca = lado * 0.11;
    const cap = ctx.createLinearGradient(cx - ca / 2, 0, cx + ca / 2, 0);
    cap.addColorStop(0, "rgb(120,96,108)");
    cap.addColorStop(0.4, "rgb(240,228,234)");
    cap.addColorStop(1, "rgb(96,70,84)");
    ctx.fillStyle = cap;
    ctx.fillRect(cx - ca / 2, 0, ca, cy - R + lado * 0.02);

    // fondo: las juntas entre espejitos
    ctx.fillStyle = `rgb(${COLOR.junta})`;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    const gl = 0.07; // separación entre espejitos, en fracción de celda
    const brilloExtra = 1 + e * 0.8;

    for (const m of espejos) {
      const latM = (m.lat0 + m.lat1) / 2;
      const lonM = (m.lon0 + m.lon1) / 2;
      const n = punto(latM, lonM, giro);
      if (n[2] <= 0.04) continue; // del otro lado

      const dLat = (m.lat1 - m.lat0) * gl;
      const dLon = (m.lon1 - m.lon0) * gl;
      const esq = [
        punto(m.lat0 + dLat, m.lon0 + dLon, giro),
        punto(m.lat0 + dLat, m.lon1 - dLon, giro),
        punto(m.lat1 - dLat, m.lon1 - dLon, giro),
        punto(m.lat1 - dLat, m.lon0 + dLon, giro),
      ];

      // reflejo de la vista sobre la faceta: qué "ve" el espejito
      const rx = 2 * n[2] * n[0], ry = 2 * n[2] * n[1], rz = 2 * n[2] * n[2] - 1;
      const t = Math.min(1, Math.max(0, 0.5 + ry * 0.9));
      let r = COLOR.agua[0] + (COLOR.techo[0] - COLOR.agua[0]) * t;
      let g = COLOR.agua[1] + (COLOR.techo[1] - COLOR.agua[1]) * t;
      let b = COLOR.agua[2] + (COLOR.techo[2] - COLOR.agua[2]) * t;
      if (m.tono > 0.82) { r = (r + COLOR.lila[0]) / 2; g = (g + COLOR.lila[1]) / 2; b = (b + COLOR.lila[2]) / 2; }

      const difusa = Math.max(0, n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]);
      const borde = Math.pow(n[2], 0.4);  // oscurece hacia el contorno
      const luz = (0.5 + 0.6 * difusa + (m.tono - 0.5) * 0.4) * borde;
      // algunos espejitos agarran otra luz de la sala y quedan casi blancos
      const destello = m.tono > 0.92 ? 0.45 : 0;
      const spec = Math.pow(Math.max(0, rx * LUZ[0] + ry * LUZ[1] + rz * LUZ[2]), 30) * brilloExtra + destello;

      r = Math.min(255, r * luz + 255 * spec);
      g = Math.min(255, g * luz + 255 * spec);
      b = Math.min(255, b * luz + 255 * spec);

      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.beginPath();
      ctx.moveTo(cx + R * esq[0][0], cy - R * esq[0][1]);
      for (let k = 1; k < 4; k++) ctx.lineTo(cx + R * esq[k][0], cy - R * esq[k][1]);
      ctx.closePath();
      ctx.fill();
    }

    // volumen general: brillo difuso arriba a la izquierda y sombra abajo
    const vol = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx, cy, R * 1.02);
    vol.addColorStop(0, "rgba(255,255,255,0.28)");
    vol.addColorStop(0.45, "rgba(255,255,255,0)");
    vol.addColorStop(0.82, "rgba(40,10,30,0.12)");
    vol.addColorStop(1, "rgba(40,10,30,0.5)");
    ctx.fillStyle = vol;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  function pintarReflejos(giro, ahora, e) {
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rctx.clearRect(0, 0, W, H);
    const alcanceX = W * 1.05;
    const alcanceY = H * 0.85;
    const base = Math.min(W, H) * 0.034;

    for (const p of puntos) {
      const lon = p.lon + giro;
      const frente = Math.cos(lon);
      if (frente <= 0.05) continue;

      const x = bx + Math.sin(lon) * Math.cos(p.lat) * alcanceX;
      const y = by + Math.sin(p.lat) * alcanceY + (1 - frente) * 30;
      const lejos = Math.min(1.6, Math.hypot(x - bx, y - by) / (Math.min(W, H) * 0.5));
      const alto = base * p.tam * (0.7 + lejos * 0.5);
      const ancho = alto * (0.35 + 0.65 * frente);
      const titila = 0.75 + 0.25 * Math.sin(ahora / 380 + p.fase);

      rctx.globalAlpha = Math.min(1, frente * 1.8) * titila * (0.8 + e * 0.2);
      rctx.drawImage(sprites[p.color], x - ancho, y - alto, ancho * 2, alto * 2);
    }
    rctx.globalAlpha = 1;
  }

  function cuadro(ahora) {
    const giro = (((ahora - t0) % VUELTA_MS) / VUELTA_MS) * Math.PI * 2;
    const e = energia ? energia() : 0;
    pintarBola(giro, e);
    pintarReflejos(giro, ahora, e);
  }

  function bucle(ahora) {
    if (!activo) { raf = null; return; }
    cuadro(ahora);
    raf = requestAnimationFrame(bucle);
  }

  window.addEventListener("resize", () => {
    medir();
    if (reducido || !activo) cuadro(t0 + VUELTA_MS * 0.1);
  });

  medir();
  cuadro(t0 + VUELTA_MS * 0.1);

  return {
    activar() {
      if (activo || reducido) return;
      activo = true;
      medir(); // la sección pudo estar escalada durante la transición
      raf = requestAnimationFrame(bucle);
    },
    desactivar() {
      activo = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
  };
}
