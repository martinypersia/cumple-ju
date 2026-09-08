#!/usr/bin/env node
/* Verifica el contraste de cada paleta de era contra WCAG 2.1 AA.
   Uso: node scripts/contraste.mjs                                  */

import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../css/eras.css", import.meta.url), "utf8");

function oklchARgbLineal(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((v) => Math.min(1, Math.max(0, v)));
}

const luminancia = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function ratio(c1, c2) {
  const a = luminancia(oklchARgbLineal(...c1));
  const b = luminancia(oklchARgbLineal(...c2));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const NOMBRES = {
  0: "Harry Styles 2017",
  1: "Fine Line",
  2: "Harry's House",
  3: "House / patio",
  4: "Love On Tour",
  5: "Kiss All the Time",
};

const bloques = [...css.matchAll(/body\[data-era="(\d)"\]\s*\{([^}]+)\}/g)];
let fallos = 0;

for (const [, era, cuerpo] of bloques) {
  const t = {};
  for (const [, k, L, C, H] of cuerpo.matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g
  )) t[k] = [parseFloat(L), parseFloat(C), parseFloat(H)];

  if (!t.bg || !t.ink) continue;

  const pruebas = [
    ["ink / bg        (cuerpo)", t.ink, t.bg, 4.5],
    ["ink-dim / bg    (cuerpo)", t["ink-dim"], t.bg, 4.5],
    ["accent / bg     (grande)", t.accent, t.bg, 3.0],
    ["on-accent / accent (botón)", t["on-accent"], t.accent, 4.5],
  ];

  console.log(`\n  ${era} · ${NOMBRES[era]}`);
  for (const [etiqueta, c1, c2, minimo] of pruebas) {
    if (!c1 || !c2) continue;
    const r = ratio(c1, c2);
    const ok = r >= minimo;
    if (!ok) fallos++;
    console.log(
      `    ${ok ? "PASA" : "FALLA"}  ${etiqueta.padEnd(28)} ${r.toFixed(2)}:1  (min ${minimo})`
    );
  }
}

console.log(fallos ? `\n  ${fallos} par(es) por debajo del mínimo.\n` : "\n  Todas las paletas pasan AA.\n");
process.exit(fallos ? 1 : 0);
