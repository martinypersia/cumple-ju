#!/usr/bin/env node
/* ============================================================
   Prepara las fotos para la invitación.

   Uso:  npm run fotos

   - Lee todo lo que haya en assets/fotos/
   - Redimensiona a 1400px de lado mayor y convierte a WebP
   - Deja los originales intactos; escribe en assets/fotos/web/
   - Imprime el array listo para pegar en js/config.js

   Si sharp no está instalado, igual lista los archivos y arma el
   array apuntando a los originales.
   ============================================================ */

import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ORIGEN = join(RAIZ, "assets", "fotos");
const DESTINO = join(ORIGEN, "web");
const ANCHO = 1400;
const SOPORTADOS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

const kb = (n) => `${Math.round(n / 1024)} kB`;

let sharp = null;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.log("\n  sharp no está instalado. Corré `npm install` para optimizar las fotos.");
  console.log("  Por ahora armo la lista apuntando a los archivos originales.\n");
}

let archivos;
try {
  archivos = (await readdir(ORIGEN, { withFileTypes: true }))
    .filter((d) => d.isFile() && SOPORTADOS.has(extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
} catch {
  console.error(`\n  No encontré la carpeta ${ORIGEN}\n`);
  process.exit(1);
}

const heic = (await readdir(ORIGEN)).filter((n) => /\.(heic|heif)$/i.test(n));
if (heic.length) {
  console.log(`  Encontré ${heic.length} archivo(s) HEIC de iPhone. Exportalos como JPG antes de seguir:`);
  console.log("  en Fotos, Compartir > Opciones > Formato: Más compatible.\n");
}

if (!archivos.length) {
  console.log(`\n  Todavía no hay fotos en assets/fotos/. Dejalas ahí y volvé a correr esto.\n`);
  process.exit(0);
}

const salida = [];

if (sharp) {
  await mkdir(DESTINO, { recursive: true });
  console.log(`\n  Procesando ${archivos.length} foto(s)...\n`);

  for (const [i, nombre] of archivos.entries()) {
    const n = String(i + 1).padStart(2, "0");
    const destino = join(DESTINO, `${n}.webp`);
    const antes = (await stat(join(ORIGEN, nombre))).size;

    await sharp(join(ORIGEN, nombre))
      .rotate()
      .resize({ width: ANCHO, height: ANCHO, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(destino);

    const despues = (await stat(destino)).size;
    console.log(`  ${n}  ${basename(nombre).padEnd(28)} ${kb(antes).padStart(8)} -> ${kb(despues).padStart(8)}`);
    salida.push({ src: `assets/fotos/web/${n}.webp`, alt: "" });
  }
} else {
  archivos.forEach((nombre) => salida.push({ src: `assets/fotos/${nombre}`, alt: "" }));
}

const bloque =
  "fotos: [\n" +
  salida.map((f) => `    { src: "${f.src}", alt: "" },`).join("\n") +
  "\n  ],";

await writeFile(join(ORIGEN, "lista-para-config.txt"), bloque + "\n", "utf8");

console.log("\n  Pegá esto en js/config.js reemplazando la línea `fotos: [],`");
console.log("  (también quedó guardado en assets/fotos/lista-para-config.txt)\n");
console.log(bloque + "\n");
console.log("  Completá cada `alt` con una descripción corta de la foto.");
console.log("  Se lee en voz alta y aparece si la imagen no carga.\n");
