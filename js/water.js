/* ============================================================
   AGUA ROSA — simulación de ondas en tiempo real para la portada
   (la era 2017: un disco homónimo, rosa y con agua).

   Algoritmo clásico de dos buffers de altura: cada celda toma el
   promedio de sus vecinas menos su valor anterior, con amortiguación.
   Se simula en baja resolución y el navegador escala el canvas con
   suavizado; el resultado es agua blanda, y cuesta poco en el celular.

   Los colores y los topes de brillo/valle están calculados para que el
   texto encima pase WCAG AA incluso en el valle más oscuro. Si los
   cambiás, volvé a verificar el contraste.
   ============================================================ */

const COLOR = {
  arriba: [251, 204, 221], // oklch(0.890 0.058 355)
  abajo:  [233, 163, 188], // oklch(0.790 0.088 356)
  brillo: [255, 241, 249], // oklch(0.975 0.022 350)
  valle:  [210, 120, 153], // oklch(0.680 0.118 357)
};
const TOPE_VALLE = 0.55;  // el contraste del texto está calculado con este tope
const TOPE_BRILLO = 0.85;
const AMORTIGUACION = 0.022;
const CELDAS = 60000;     // presupuesto de celdas: define la escala

export function crearAgua(canvas, superficie, { reducido = false, energia = null } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let w = 0, h = 0;
  let a, b, img, px, fondo;
  let activo = false;
  let raf = null;
  let proximaGota = 0;
  let ultimoGolpe = 0;
  let ultimoRastro = 0;
  let apretado = false;

  function medir() {
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || window.innerHeight;
    const escala = Math.max(3, Math.ceil(Math.sqrt((W * H) / CELDAS)));
    w = Math.ceil(W / escala) + 2;
    h = Math.ceil(H / escala) + 2;
    canvas.width = w;
    canvas.height = h;
    a = new Float32Array(w * h);
    b = new Float32Array(w * h);
    img = ctx.createImageData(w, h);
    px = img.data;

    // el color base de cada fila: más claro arriba, más profundo abajo
    fondo = new Float32Array(h * 3);
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1);
      for (let k = 0; k < 3; k++) {
        fondo[y * 3 + k] = COLOR.arriba[k] + (COLOR.abajo[k] - COLOR.arriba[k]) * t;
      }
    }
  }

  function gota(cx, cy, radio, fuerza) {
    const r = Math.max(1, Math.round(radio));
    const x0 = Math.round(cx);
    const y0 = Math.round(cy);
    for (let dy = -r; dy <= r; dy++) {
      const y = y0 + dy;
      if (y < 1 || y >= h - 1) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = x0 + dx;
        if (x < 1 || x >= w - 1) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) continue;
        a[y * w + x] -= fuerza * (0.5 + 0.5 * Math.cos((Math.PI * d) / r));
      }
    }
  }

  function paso() {
    for (let y = 1; y < h - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        const v = (a[i - 1] + a[i + 1] + a[i - w] + a[i + w]) * 0.5 - b[i];
        b[i] = v - v * AMORTIGUACION;
      }
    }
    const t = a; a = b; b = t;
  }

  function pintar() {
    const [BR, BG, BB] = COLOR.brillo;
    const [VR, VG, VB] = COLOR.valle;
    let p = 0;
    for (let y = 0; y < h; y++) {
      const fr = fondo[y * 3], fg = fondo[y * 3 + 1], fb = fondo[y * 3 + 2];
      const arriba = y > 0 ? -w : 0;
      const abajo = y < h - 1 ? w : 0;
      for (let x = 0; x < w; x++, p += 4) {
        const i = y * w + x;
        const izq = x > 0 ? a[i - 1] : a[i];
        const der = x < w - 1 ? a[i + 1] : a[i];
        // la luz viene de arriba a la izquierda
        const s = ((izq - der) * 0.55 + (a[i + arriba] - a[i + abajo]) * 0.85) / 150;
        let r = fr, g = fg, bl = fb;
        if (s > 0) {
          const k = s < TOPE_BRILLO ? s : TOPE_BRILLO;
          r += (BR - r) * k; g += (BG - g) * k; bl += (BB - bl) * k;
        } else if (s < 0) {
          const k = -s < TOPE_VALLE ? -s : TOPE_VALLE;
          r += (VR - r) * k; g += (VG - g) * k; bl += (VB - bl) * k;
        }
        px[p] = r; px[p + 1] = g; px[p + 2] = bl; px[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function ambiente(ahora) {
    // lluvia suave para que el agua nunca esté quieta
    if (ahora >= proximaGota) {
      gota(1 + Math.random() * (w - 2), 1 + Math.random() * (h - 2),
           1.5 + Math.random() * 1.5, 110 + Math.random() * 140);
      proximaGota = ahora + 650 + Math.random() * 900;
    }
    // con la música sonando, los graves también tiran gotas
    if (energia) {
      const e = energia();
      if (e > 0.62 && ahora - ultimoGolpe > 260) {
        gota(1 + Math.random() * (w - 2), 1 + Math.random() * (h - 2), 2.5, 300 * e);
        ultimoGolpe = ahora;
      }
    }
  }

  function bucle(ahora) {
    if (!activo) { raf = null; return; }
    ambiente(ahora);
    paso();
    pintar();
    raf = requestAnimationFrame(bucle);
  }

  function aCeldas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * w, ((clientY - r.top) / r.height) * h];
  }

  /** Versión fija para movimiento reducido: unas ondas, sin animación. */
  function estatico() {
    for (let n = 0; n < 5; n++) {
      gota(w * (0.15 + Math.random() * 0.7), h * (0.1 + Math.random() * 0.8), 3, 420);
    }
    for (let n = 0; n < 48; n++) paso();
    pintar();
  }

  // --- interacción ---
  superficie.addEventListener("pointerdown", (e) => {
    apretado = true;
    if (reducido) return;
    const [x, y] = aCeldas(e.clientX, e.clientY);
    gota(x, y, 3, 520);
  });
  window.addEventListener("pointerup", () => { apretado = false; });
  window.addEventListener("pointercancel", () => { apretado = false; });

  superficie.addEventListener("pointermove", (e) => {
    if (reducido) return;
    const ahora = performance.now();
    if (ahora - ultimoRastro < 40) return;
    // con mouse el rastro sigue al puntero; con el dedo, sólo al arrastrar
    if (e.pointerType !== "mouse" && !apretado) return;
    ultimoRastro = ahora;
    const [x, y] = aCeldas(e.clientX, e.clientY);
    gota(x, y, 1.6, e.pointerType === "mouse" ? 80 : 150);
  }, { passive: true });

  window.addEventListener("resize", () => {
    medir();
    if (reducido || !activo) estatico();
  });

  medir();
  if (reducido) {
    estatico();
  } else {
    // que el primer cuadro ya tenga ondas
    gota(w * 0.3, h * 0.25, 3, 380);
    gota(w * 0.72, h * 0.6, 3, 300);
    for (let n = 0; n < 10; n++) paso();
    pintar();
  }

  return {
    activar() {
      if (activo || reducido) return;
      activo = true;
      raf = requestAnimationFrame(bucle);
    },
    desactivar() {
      activo = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    /** Un chapuzón grande en un punto de la pantalla. */
    salpicar(clientX, clientY) {
      if (reducido) return;
      const [x, y] = aCeldas(clientX, clientY);
      gota(x, y, 6, 1100);
    },
  };
}
