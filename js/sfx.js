/* ============================================================
   EFECTOS DE SONIDO
   Sintetizados con Web Audio: no hay archivo que cargar.
   Contexto propio, aparte del de la música, para no depender de que
   el tema haya arrancado.

   En el celular el toque de "pointerdown" todavía no habilita el audio
   (lo habilita recién el "pointerup"). Si el contexto está dormido,
   pedimos resume() y sonamos cuando despierte, pero sólo si fue enseguida:
   un "error" que llega un segundo tarde ya no es chiste.
   ============================================================ */

let ctx = null;

function contexto() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { ctx = null; }
  return ctx;
}

/** Dos notas cortas que bajan, suaves: "nop". */
function nop() {
  const t = ctx.currentTime + 0.01;
  const salida = ctx.createGain();
  salida.gain.value = 0.16;
  salida.connect(ctx.destination);

  [[330, 0], [247, 0.09]].forEach(([hz, desfase]) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(hz, t + desfase);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.94, t + desfase + 0.12);
    env.gain.setValueAtTime(0.0001, t + desfase);
    env.gain.exponentialRampToValueAtTime(1, t + desfase + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + desfase + 0.13);
    osc.connect(env).connect(salida);
    osc.start(t + desfase);
    osc.stop(t + desfase + 0.15);
  });
}

export function sonarError() {
  if (!contexto()) return;
  if (ctx.state === "running") { nop(); return; }
  const pedido = performance.now();
  ctx.resume()
    .then(() => { if (performance.now() - pedido < 700) nop(); })
    .catch(() => {});
}
