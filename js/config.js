/* ============================================================
   DATOS DE LA FIESTA
   Este es el ÚNICO archivo que necesitás editar.
   Todo lo que está entre [corchetes] es un placeholder.
   ============================================================ */

export const CONFIG = {
  // --- Quién ---
  nombre: "Juli",
  nombreCompleto: "Julieta",
  edad: null, // un número, o null para no mostrar la edad

  // --- Cuándo ---
  // Formato ISO con huso horario. Argentina es -03:00.
  fecha: "2026-10-03T13:00:00-03:00", // sábado 3 de octubre, 13 h
  horaFin: "[hasta que los eche]",

  // --- Dónde ---
  lugar: {
    nombre: "Barrio Portal de los Sauces",
    direccion: "Casa 19",
    // Pegá acá el link de Google Maps. Si lo dejás vacío, el botón
    // arma la búsqueda solo con la dirección de arriba.
    // (cae en Rawson 1825, Maipú, Mendoza)
    mapsUrl: "https://maps.app.goo.gl/uweo7EUuWZYL8ras8",
    nota: "[Cómo llegar, estacionamiento, timbre, lo que haga falta]",
  },

  // --- El link del grupo ---
  // https://chat.whatsapp.com/XXXXXXXXXXXX
  whatsappGrupo: "https://chat.whatsapp.com/GpKfEPufgkQB6coBQ4BBtR",

  // --- Música ---
  // Dejá tu MP3 en assets/audio/ y poné el nombre acá.
  // Si el archivo no existe, la invitación funciona igual, en silencio.
  audio: "assets/audio/dancenomore.mp3?v=2",

  // --- Fotos ---
  // Dejá las fotos en assets/fotos/ y listalas acá.
  // Si el array queda vacío, se muestran marcos vacíos con instrucciones.
  // Ejemplo: [{ src: "assets/fotos/01.webp", alt: "Juli en el after, 2024" }]
  fotos: [
    { src: "assets/fotos/web/luju.webp?v=2", alt: "Juli y Lucas" },
  ],

  // La foto que va adentro del círculo de la segunda pantalla.
  // Dejala en null y queda un marco vacío.
  fotoPrincipal: null, // { src: "assets/fotos/portada.webp", alt: "..." }

  // --- Chistes internos ---
  // Tres huecos. Dejalos vacíos y se usa el texto de fábrica.
  chistes: {
    quien: "",   // pantalla 2, arriba del círculo
    cuando: "",  // pantalla 3, debajo de la fecha
    donde: "",   // pantalla 4, debajo de la dirección
    galeria: "", // pantalla 5, título de la galería
    cierre: "",  // pantalla 6, encima del botón
  },
};
