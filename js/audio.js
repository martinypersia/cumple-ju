/* ============================================================
   AUDIO
   El navegador exige un gesto del usuario para reproducir sonido.
   Ese gesto es el botón "Bajar la púa": la restricción es el momento.

   Si el MP3 no existe o falla, todo sigue funcionando en silencio y
   el pulso visual pasa a un latido sintético, para que la bola de
   disco no se vea muerta.
   ============================================================ */

const STORE_KEY = "fc-juli:muted";
const VOLUMEN = 0.85;

let el = null;
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

function conectarAnalizador() {
  if (analyser || !el) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    const fuente = ctx.createMediaElementSource(el);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    bins = new Uint8Array(analyser.frequencyBinCount);
    fuente.connect(analyser);
    analyser.connect(ctx.destination);
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    analyser = null;
  }
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
}

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
    try {
      await el.play();
      disponible = true;
      this.available = true;
      conectarAnalizador();
      fundir(this.muted ? 0 : VOLUMEN, 1600);
      return true;
    } catch {
      disponible = false;
      this.available = false;
      return false;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    guardarSilencio(this.muted);
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
