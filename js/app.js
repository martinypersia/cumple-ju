import { CONFIG } from "./config.js";
import { audio } from "./audio.js";
import { crearAgua } from "./water.js";
import { crearBola } from "./bola.js";
import { sonarError } from "./sfx.js";
import { lanzarConfeti } from "./confeti.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const eras = $$(".era");
const dots = $("#dots");
let current = 0;

/* ============================================================
   DATOS → PANTALLA
   ============================================================ */

const fecha = new Date(CONFIG.fecha);
const fechaOk = !Number.isNaN(fecha.getTime());

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function fmt(opts) {
  if (!fechaOk) return "—";
  try { return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", ...opts }).format(fecha); }
  catch { return new Intl.DateTimeFormat("es-AR", opts).format(fecha); }
}

// "sábado 3 de octubre", armado a mano: Intl mete una coma después del día
// de la semana, y en una frase ("en vivo el sábado, 3 de…") queda raro.
function diaTexto() {
  return `${fmt({ weekday: "long" })} ${fmt({ day: "numeric" })} de ${fmt({ month: "long" })}`;
}

const valores = {
  nombre: CONFIG.nombre || "[NOMBRE]",
  edad: CONFIG.edad,
  diaLargo: fechaOk ? cap(diaTexto()) : "[falta la fecha]",
  diaCorto: fechaOk ? diaTexto() : "[falta la fecha]",
  hora: fechaOk ? fmt({ hour: "2-digit", minute: "2-digit" }) + " h" : "—",
  horaFin: CONFIG.horaFin || "—",
  lugarNombre: CONFIG.lugar?.nombre || "[NOMBRE DEL LUGAR]",
  direccion: CONFIG.lugar?.direccion || "[Calle 1234, Ciudad]",
};

$$("[data-bind]").forEach((n) => {
  const v = valores[n.dataset.bind];
  if (v !== undefined && v !== null && v !== "") n.textContent = v;
});

$$("[data-joke]").forEach((n) => {
  const v = CONFIG.chistes?.[n.dataset.joke];
  if (v) n.textContent = v;
});

// La edad es opcional.
if (typeof CONFIG.edad === "number") $("#age").hidden = false;

// Foto del círculo.
if (CONFIG.fotoPrincipal?.src) {
  const img = new Image();
  img.src = CONFIG.fotoPrincipal.src;
  img.alt = CONFIG.fotoPrincipal.alt || `${valores.nombre} en el círculo`;
  img.decoding = "async";
  img.addEventListener("load", () => { $("#lensMedia").replaceChildren(img); });
}

// El texto del anillo tiene que cerrar la vuelta justa, sin hueco ni
// sobrante. Su largo depende de la fuente, así que se mide ya cargada y
// la diferencia se reparte en el espaciado entre letras.
function ajustarAnillo() {
  const tp = $(".lens__text textPath");
  if (!tp) return;
  tp.style.letterSpacing = "";
  const vuelta = $("#lensCircle").getTotalLength();
  const texto = tp.getComputedTextLength();
  if (!texto) return;
  const base = parseFloat(getComputedStyle(tp).letterSpacing) || 0;
  tp.style.letterSpacing = `${base + (vuelta - texto) / tp.textContent.length}px`;
}
document.fonts.ready.then(ajustarAnillo);

// Mapa.
const maps = $("#maps");
const consulta = CONFIG.lugar?.mapsUrl
  || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
       [CONFIG.lugar?.nombre, CONFIG.lugar?.direccion].filter(Boolean).join(" ")
     )}`;
maps.href = consulta;

// Nota de cómo llegar.
if (CONFIG.lugar?.nota && !CONFIG.lugar.nota.startsWith("[")) {
  const nota = document.createElement("p");
  nota.className = "fineprint";
  nota.textContent = CONFIG.lugar.nota;
  maps.before(nota);
}

// Link del grupo.
const wa = $("#wa");
if (CONFIG.whatsappGrupo) {
  wa.href = CONFIG.whatsappGrupo;
} else {
  wa.setAttribute("aria-disabled", "true");
  wa.style.opacity = "0.55";
  wa.addEventListener("click", (e) => e.preventDefault());
  $("#waFallback").hidden = false;
}

/* ============================================================
   GALERÍA
   ============================================================ */

const gallery = $("#gallery");
const fotos = Array.isArray(CONFIG.fotos) ? CONFIG.fotos : [];
const marcos = fotos.length ? fotos : Array.from({ length: 4 }, () => null);

marcos.forEach((foto, i) => {
  const fig = document.createElement("figure");
  fig.className = "shot";
  fig.style.setProperty("--r", `${(i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.6)}deg`);

  if (foto) {
    const img = new Image();
    img.src = foto.src;
    img.alt = foto.alt || "";
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";
    fig.append(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "ph";
    ph.innerHTML = `<span class="ph__label">foto ${i + 1}</span><span class="ph__hint">assets/fotos/</span>`;
    fig.append(ph);
  }

  const n = document.createElement("figcaption");
  n.className = "shot__n";
  n.textContent = String(i + 1).padStart(2, "0");
  fig.append(n);

  gallery.append(fig);
});

/* ============================================================
   ODÓMETRO
   ============================================================ */

const odo = $("#odo");
const unidades = [
  { key: "d", label: "días",  len: 2 },
  { key: "h", label: "horas", len: 2 },
  { key: "m", label: "min",   len: 2 },
  { key: "s", label: "seg",   len: 2 },
];
const reels = {};

function construirOdometro() {
  unidades.forEach((u) => {
    const unit = document.createElement("div");
    unit.className = "odo__unit";

    const digits = document.createElement("div");
    digits.className = "odo__digits";

    reels[u.key] = [];
    for (let i = 0; i < u.len; i++) {
      const reel = document.createElement("div");
      reel.className = "odo__reel";
      reel.innerHTML = Array.from({ length: 10 }, (_, d) => `<span>${d}</span>`).join("");
      digits.append(reel);
      reels[u.key].push(reel);
    }

    const label = document.createElement("span");
    label.className = "odo__label";
    label.textContent = u.label;

    unit.append(digits, label);
    odo.append(unit);
  });
}

function setUnidad(key, valor) {
  const arr = reels[key];
  if (!arr) return;
  const s = String(Math.max(0, valor)).padStart(arr.length, "0").slice(-arr.length);
  arr.forEach((reel, i) => reel.style.setProperty("--d", s[i]));
}

function tick() {
  if (!fechaOk) {
    $("#cdTitle").textContent = "Falta cargar la fecha en js/config.js";
    odo.hidden = true;
    return;
  }
  const restante = fecha.getTime() - Date.now();

  if (restante <= 0) {
    odo.hidden = true;
    $("#cdTitle").textContent = restante > -6 * 3600e3
      ? "Está pasando ahora mismo"
      : "Ya pasó. Fue hermoso.";
    $("#cdText").textContent = $("#cdTitle").textContent;
    return;
  }

  const seg = Math.floor(restante / 1000);
  const d = Math.floor(seg / 86400);
  const h = Math.floor((seg % 86400) / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;

  // los días pueden pasar de 99: agrandamos la primera unidad si hace falta
  if (d > 99 && reels.d.length === 2) {
    const reel = document.createElement("div");
    reel.className = "odo__reel";
    reel.innerHTML = Array.from({ length: 10 }, (_, x) => `<span>${x}</span>`).join("");
    reels.d[0].before(reel);
    reels.d.unshift(reel);
  }

  setUnidad("d", d);
  setUnidad("h", h);
  setUnidad("m", m);
  setUnidad("s", s);

  $("#cdTitle").textContent = d === 0 && h === 0 ? "Falta" : "Faltan";
  $("#cdText").textContent = `Faltan ${d} días, ${h} horas y ${m} minutos.`;
}

construirOdometro();
tick();
setInterval(tick, 1000);

/* ============================================================
   NAVEGACIÓN
   ============================================================ */

eras.forEach((era, i) => {
  era.hidden = false; // sin JS sólo se ve la primera; con JS manda el CSS
  $$("[data-reveal]", era).forEach((el, j) => el.style.setProperty("--i", j));
  const dot = document.createElement("button");
  dot.className = "dot" + (i === 0 ? " is-on" : "");
  dot.type = "button";
  dot.innerHTML = `<span class="sr-only">Pantalla ${i + 1} de ${eras.length}</span>`;
  dot.addEventListener("click", () => ir(i));
  dots.append(dot);
});

const puntos = $$(".dot", dots);

function ir(i) {
  const destino = Math.max(0, Math.min(eras.length - 1, i));
  if (destino === current) return;

  eras[current].classList.remove("is-active");
  eras[destino].classList.add("is-active");
  puntos[current].classList.remove("is-on");
  puntos[destino].classList.add("is-on");

  document.body.dataset.era = String(destino);
  eras[destino].scrollTop = 0;
  current = destino;

  // el agua y la bola sólo se animan mientras se ven: ahorra batería en el celular
  if (destino === 0) { agua.activar(); bola.activar(); }
  else { agua.desactivar(); bola.desactivar(); }

  // la barra del navegador acompaña el cambio de era, ya terminada la transición
  clearTimeout(ir.pintarBarra);
  ir.pintarBarra = setTimeout(() => {
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", getComputedStyle(document.body).backgroundColor);
  }, 660);
}

$$("[data-next]").forEach((b) => b.addEventListener("click", () => ir(current + 1)));
$("#replay").addEventListener("click", () => ir(0));

// Sólo izquierda/derecha: arriba y abajo tienen que seguir sirviendo para
// desplazar una pantalla que no entra completa.
// Desde la portada, avanzar equivale a tocar el botón: si no, la música
// nunca arrancaría.
document.addEventListener("keydown", (e) => {
  if (["ArrowRight", "PageDown"].includes(e.key)) {
    e.preventDefault();
    if (current === 0) empezar(); else ir(current + 1);
  }
  if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ir(current - 1); }
});

let x0 = null, y0 = null;
document.addEventListener("touchstart", (e) => {
  // en la portada arrastrar el dedo es jugar con el agua, no deslizar
  if (current === 0 || e.target.closest(".gallery")) { x0 = null; return; }
  x0 = e.changedTouches[0].clientX;
  y0 = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  const dy = e.changedTouches[0].clientY - y0;
  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) ir(current + (dx < 0 ? 1 : -1));
  x0 = null;
}, { passive: true });

/* ============================================================
   PORTADA: METERSE AL AGUA
   ============================================================ */

const mute = $("#mute");
const start = $("#start");

const agua = crearAgua($("#water"), $("#era-0"), {
  reducido: reduced,
  // con la música sonando, los graves tiran gotas si se vuelve a la portada
  energia: () => (audio.available && !audio.muted ? audio.energy() : 0),
});
agua.activar();

const bola = crearBola($("#bola"), $("#reflejos"), {
  reducido: reduced,
  // con la música, los graves hacen brillar más los espejitos y los reflejos
  energia: () => (audio.available && !audio.muted ? audio.energy() : 0),
});
bola.activar();

// los videos que hacen de GIF no llevan autoplay en el HTML: con
// movimiento reducido quedan en el cuadro fijo del poster
if (!reduced) $$("video[data-autoplay]").forEach((v) => v.play().catch(() => {}));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { agua.desactivar(); bola.desactivar(); }
  else if (current === 0) { agua.activar(); bola.activar(); }
});

function mostrarSilencio() {
  mute.hidden = false;
  mute.setAttribute("aria-pressed", String(audio.muted));
}

/** Arranca la música y entra a la invitación. Siempre desde un gesto. */
let empezando = false;
function empezar() {
  if (empezando) return;
  empezando = true;

  // audio.start() tiene que llamarse ya, sin nada asíncrono antes,
  // para que el navegador lo reconozca como parte del gesto
  const sonando = audio.start();

  const r = start.getBoundingClientRect();
  agua.salpicar(r.left + r.width / 2, r.top + r.height / 2);
  if (!reduced) lanzarConfeti(r.left + r.width / 2, r.top + r.height / 2);

  sonando.then((ok) => { if (ok) mostrarSilencio(); });
  setTimeout(() => { ir(1); empezando = false; }, reduced ? 120 : 900);
}

start.addEventListener("click", empezar);

/* ------------------------------------------------------------
   "NO PUEDO IR": no se deja tocar
   Se corre apenas el dedo lo apoya (o el mouse se le acerca) a un lugar
   al azar de la pantalla, lejos de donde estaba. No hace nada más.
   ------------------------------------------------------------ */

const nope = $("#nope");
let ultimoEscape = 0;

function escapar(px, py) {
  const ahora = performance.now();
  if (ahora - ultimoEscape < 120) return; // pointerenter + pointerdown juntos
  ultimoEscape = ahora;

  const nx = parseFloat(nope.style.getPropertyValue("--nx")) || 0;
  const ny = parseFloat(nope.style.getPropertyValue("--ny")) || 0;
  const r = nope.getBoundingClientRect();
  // posición sin el desplazamiento actual: desde ahí se mide el nuevo
  const baseX = r.left - nx;
  const baseY = r.top - ny;

  const margen = 16;
  const arriba = 72;   // deja libre el botón de silencio
  const abajo = 96;    // y los puntos de navegación
  const maxX = Math.max(margen, window.innerWidth - r.width - margen);
  const maxY = Math.max(arriba, window.innerHeight - r.height - abajo);

  // origen del peligro: el dedo, o el centro del botón si vino por teclado
  const ox = px ?? r.left + r.width / 2;
  const oy = py ?? r.top + r.height / 2;

  // de varios lugares al azar, el más lejano al dedo
  let mejor = null, mejorDist = -1;
  for (let k = 0; k < 14; k++) {
    const x = margen + Math.random() * (maxX - margen);
    const y = arriba + Math.random() * (maxY - arriba);
    const d = Math.hypot(x + r.width / 2 - ox, y + r.height / 2 - oy);
    if (d > mejorDist) { mejor = [x, y]; mejorDist = d; }
  }

  nope.style.setProperty("--nx", `${(mejor[0] - baseX).toFixed(1)}px`);
  nope.style.setProperty("--ny", `${(mejor[1] - baseY).toFixed(1)}px`);
  nope.style.setProperty("--nr", `${(Math.random() * 12 - 6).toFixed(1)}deg`);
  sonarError();
}

nope.addEventListener("pointerdown", (e) => {
  e.preventDefault(); // sin foco, sin selección, sin mouse emulado
  escapar(e.clientX, e.clientY);
});
nope.addEventListener("pointerenter", (e) => {
  if (e.pointerType === "mouse") escapar(e.clientX, e.clientY);
});
// con teclado (Enter/Espacio) también se escapa; un click de verdad no llega
nope.addEventListener("click", (e) => {
  e.preventDefault();
  if (e.detail === 0) escapar();
});

// si cambia el ancho (girar el celular), vuelve a su lugar para no quedar
// afuera; el alto cambia solo con la barra del navegador y ahí no importa
let anchoNope = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === anchoNope) return;
  anchoNope = window.innerWidth;
  ["--nx", "--ny", "--nr"].forEach((p) => nope.style.removeProperty(p));
});

// Saltar desde la portada con los puntos también es un gesto: aprovechamos
// para arrancar la música, que si no se perdería.
puntos.forEach((p, i) => p.addEventListener("click", () => {
  if (i > 0 && !audio.available) audio.start().then((ok) => { if (ok) mostrarSilencio(); });
}));

mute.addEventListener("click", () => {
  const m = audio.toggleMute();
  mute.setAttribute("aria-pressed", String(m));
  mute.querySelector(".sr-only").textContent = m ? "Activar la música" : "Silenciar la música";
});

audio.init($("#track"), CONFIG.audio);

/* ============================================================
   LUCES (canvas)
   ============================================================ */

const cv = $("#fx");
const cx = cv.getContext("2d");
let W = 0, H = 0;
const luces = [];

const PALETA = {
  4: ["255,140,205", "255,214,130"],
  5: ["255,130,200", "140,225,255"],
};

function medir() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = Math.floor(W * dpr);
  cv.height = Math.floor(H * dpr);
  cv.style.width = W + "px";
  cv.style.height = H + "px";
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function sembrar() {
  luces.length = 0;
  const n = W < 640 ? 42 : 72;
  for (let i = 0; i < n; i++) {
    luces.push({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00018,
      fase: Math.random() * Math.PI * 2,
      tono: Math.random() < 0.6 ? 0 : 1,
    });
  }
}

function pintar() {
  const energia = audio.energy();
  document.body.style.setProperty("--energy", energia.toFixed(3));
  barrerReflector();

  cx.clearRect(0, 0, W, H);
  const era = current;
  const paleta = PALETA[era];
  if (!paleta) return;

  const t = performance.now() / 1000;

  for (const l of luces) {
    if (!reduced) { l.x += l.vx; l.y += l.vy; }
    if (l.x < -0.05) l.x = 1.05; if (l.x > 1.05) l.x = -0.05;
    if (l.y < -0.05) l.y = 1.05; if (l.y > 1.05) l.y = -0.05;

    const parpadeo = reduced ? 0.55 : 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + l.fase));
    const alfa = parpadeo * (0.22 + energia * 0.6);
    const radio = l.r * (1 + energia * (era === 5 ? 1.1 : 0.5));

    cx.beginPath();
    cx.arc(l.x * W, l.y * H, radio, 0, Math.PI * 2);
    cx.fillStyle = `rgba(${paleta[l.tono]},${alfa.toFixed(3)})`;
    cx.fill();
  }
}

let rafId = null;
function bucle() {
  pintar();
  rafId = requestAnimationFrame(bucle);
}

medir();
sembrar();
window.addEventListener("resize", () => { medir(); sembrar(); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
  else if (!rafId) bucle();
});

/* ============================================================
   REFLECTOR
   ============================================================ */

const era4 = $("#era-4");
const spot = $("#spotlight");
let sigueElPuntero = false;

era4.addEventListener("pointermove", (e) => {
  sigueElPuntero = true;
  const r = era4.getBoundingClientRect();
  spot.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  spot.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
});

/* Sin puntero (celular) el reflector barre solo. Lo llama el bucle del
   canvas para no abrir un segundo requestAnimationFrame. */
function barrerReflector() {
  if (sigueElPuntero || reduced || current !== 4) return;
  const t = performance.now() / 3400;
  spot.style.setProperty("--mx", `${50 + Math.sin(t) * 32}%`);
  spot.style.setProperty("--my", `${34 + Math.cos(t * 0.7) * 14}%`);
}

/* Todo declarado: recién ahora arranca el bucle de dibujo. */
bucle();
