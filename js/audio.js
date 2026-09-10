/* ============================================================
   AUDIO
   El navegador exige un gesto del usuario para reproducir sonido.
   Ese gesto es el botón "Meterse al agua": la restricción es el momento.

   CUIDADO al tocar start(): todo lo que necesita la activación por
   gesto (el play, la creación del AudioContext y su resume) va en el
   mismo bloque síncrono, ANTES del primer await. Si el AudioContext se
   crea después de un await, puede nacer suspendido; y como
   createMediaElementSource desvía la salida del <audio> hacia ese
   grafo, el tema avanza pero no se escucha. Ese fue el bug de "a veces
   suena y a veces no".

   Si el MP3 no existe o falla, todo sigue funcionando en silencio y el
   pulso visual pasa a un latido sintético.
   ============================================================ */

const STORE_KEY = "fc-juli:muted";
const VOLUMEN = 0.85;

let el = null;
let ctx = null;
let analyser = null;
let bins = null;
let disponible = false;
let arrancado = false;

function leerSilencio() {
  try { return localStorage.getItem(STORE_KEY) === "1"; }
  catch { return false; }
}

function guardarSilencio(v) {
  try { localStorage.setItem(STORE_KEY, v ? "1" : "0"); }
  catch { /* modo privado: seguimos igual */ }
}

/** Síncrona a propósito: tiene que correr dentro del gesto del usuario. */
function conectarAnalizador() {
  if (ctx || !el) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
    const fuente = ctx.createMediaElementSource(el);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    bins = new Uint8Array(analyser.frequencyBinCount);
    fuente.connect(analyser);
    analyser.connect(ctx.destination);
    ctx.addEventListener("statechange", despertar);
  } catch {
    // Sin analizador el audio sale igual por la ruta normal del elemento.
    ctx = null;
    analyser = null;
  }
}

/** Vuelve a poner en marcha lo que el navegador haya suspendido. */
function despertar() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  if (el && el.getAttribute("src") && arrancado && el.paused) el.play().catch(() => {});
}

function fundir(hasta, ms) {
  if (!el) return;
  const desde = el.volume;
  const t0 = performance.now();
  const paso = (ahora) => {
    const k = Math.min(1, (ahora - t0) / ms);
    el.volume = desde + (hasta - desde) * (1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  // Red de seguridad: si el navegador frena los frames a mitad del
  // fundido, el volumen no puede quedarse clavado en cero.
  setTimeout(() => { if (el) el.volume = hasta; }, ms + 120);
}

// El navegador suspende el contexto al pasar la pestaña a segundo plano
// (o al cambiar de app en el celular). Al volver, lo despertamos.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) despertar();
});
// Último recurso: cualquier toque posterior reintenta.
document.addEventListener("pointerdown", despertar, { passive: true });

export const audio = {
  muted: leerSilencio(),
  available: false,

  init(elemento, src) {
    el = elemento;
    if (!src) return;
    el.src = src;
    el.volume = 0;
    el.addEventListener("error", () => {
      disponible = false;
      this.available = false;
    }, { once: true });
  },

  /** Arranca la música. Tiene que llamarse DENTRO de un gesto del usuario. */
  async start() {
    if (arrancado || !el || !el.getAttribute("src")) return false;
    arrancado = true;

    // --- bloque síncrono: acá todavía vale la activación por gesto ---
    const reproduciendo = el.play();
    conectarAnalizador();
    const contextoListo = ctx ? ctx.resume().catch(() => {}) : Promise.resolve();
    // -----------------------------------------------------------------

    try {
      await reproduciendo;
    } catch {
      disponible = false;
      this.available = false;
      return false;
    }

    await contextoListo;
    disponible = true;
    this.available = true;
    fundir(this.muted ? 0 : VOLUMEN, 1600);

    // Verificación real: que el tiempo del audio haya avanzado.
    // Si no avanzó, el contexto quedó dormido: lo despertamos.
    const marca = el.currentTime;
    setTimeout(() => {
      if (!this.muted && el.currentTime === marca) despertar();
    }, 700);

    return true;
  },

  toggleMute() {
    this.muted = !this.muted;
    guardarSilencio(this.muted);
    if (!this.muted) despertar();
    fundir(this.muted ? 0 : VOLUMEN, 320);
    return this.muted;
  },

  /** Energía 0..1 para alimentar los efectos visuales. */
  energy() {
    if (analyser && disponible && !this.muted) {
      analyser.getByteFrequencyData(bins);
      let suma = 0;
      const n = 16; // graves: donde vive el pulso de una pista disco
      for (let i = 1; i <= n; i++) suma += bins[i];
      return Math.min(1, suma / (n * 190));
    }
    // respaldo: latido sintético a ~112 bpm
    const t = performance.now() / 1000;
    const golpe = Math.pow(Math.max(0, Math.sin(t * Math.PI * 112 / 60)), 6);
    return 0.18 + golpe * 0.42;
  },
};
