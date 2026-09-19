/* ============================================================
   CONFETI
   Corazoncitos (los de Harry) con algunos papelitos, en un canvas propio
   por encima de las pantallas: así la explosión sigue viéndose mientras
   la portada da paso a la pantalla siguiente.
   El canvas se crea recién la primera vez y el bucle se apaga solo
   cuando no queda nada en el aire.
   ============================================================ */

const COLORES = [
  "#7a1a36", // bordó de la portada
  "#e0457b", // fucsia de Fine Line
  "#ff8fb8",
  "#fff4f7", // crema
  "#f2c14e", // dorado
];

let cv = null, cx = null, W = 0, H = 0;
let piezas = [];
let rafId = null;
let anterior = 0;

function preparar() {
  if (cv) return;
  cv = document.createElement("canvas");
  cv.className = "confeti";
  cv.setAttribute("aria-hidden", "true");
  document.body.append(cv);
  cx = cv.getContext("2d");
  medir();
  window.addEventListener("resize", medir);
}

function medir() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = Math.floor(W * dpr);
  cv.height = Math.floor(H * dpr);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function corazon(s) {
  // corazón centrado en el origen, de ancho ~2s
  cx.beginPath();
  cx.moveTo(0, s * 0.35);
  cx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.55, -s * 1.15, 0, -s * 0.5);
  cx.bezierCurveTo(s * 0.55, -s * 1.15, s * 1.1, -s * 0.35, 0, s * 0.35);
  cx.fill();
}

function paso(ahora) {
  const dt = Math.min(0.033, (ahora - anterior) / 1000);
  anterior = ahora;
  cx.clearRect(0, 0, W, H);

  piezas = piezas.filter((p) => (p.vida -= dt) > 0 && p.y < H + 40);

  for (const p of piezas) {
    p.vx *= 1 - p.freno * dt;
    p.vy = p.vy * (1 - p.freno * dt) + p.gravedad * dt;
    p.x += (p.vx + Math.sin(p.fase += dt * 5) * p.vaiven) * dt;
    p.y += p.vy * dt;
    p.giro += p.vgiro * dt;

    cx.save();
    cx.globalAlpha = Math.min(1, p.vida / 0.5);
    cx.translate(p.x, p.y);
    cx.rotate(p.giro);
    cx.fillStyle = p.color;
    if (p.tipo === "corazon") {
      corazon(p.tam);
    } else {
      // el papelito "da vueltas": se achica en un eje
      cx.scale(1, Math.cos(p.fase * 1.6));
      cx.fillRect(-p.tam, -p.tam * 0.45, p.tam * 2, p.tam * 0.9);
    }
    cx.restore();
  }

  rafId = piezas.length ? requestAnimationFrame(paso) : null;
  if (!rafId) cx.clearRect(0, 0, W, H);
}

/** Tira una explosión desde (x, y), en coordenadas de pantalla. */
export function lanzarConfeti(x, y) {
  preparar();
  const n = W < 640 ? 70 : 110;

  for (let i = 0; i < n; i++) {
    // cono hacia arriba, un poco abierto
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const vel = 420 + Math.random() * 620;
    const esCorazon = Math.random() < 0.65;
    piezas.push({
      tipo: esCorazon ? "corazon" : "papel",
      x, y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      gravedad: 900 + Math.random() * 300,
      freno: 2.2 + Math.random() * 1.2,
      vaiven: 20 + Math.random() * 40,
      fase: Math.random() * Math.PI * 2,
      giro: (Math.random() - 0.5) * 0.8,
      vgiro: esCorazon ? (Math.random() - 0.5) * 3 : (Math.random() - 0.5) * 12,
      tam: esCorazon ? 5 + Math.random() * 5 : 3 + Math.random() * 3,
      color: COLORES[(Math.random() * COLORES.length) | 0],
      vida: 1.8 + Math.random() * 1.1,
    });
  }

  if (!rafId) {
    anterior = performance.now();
    rafId = requestAnimationFrame(paso);
  }
}
