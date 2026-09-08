# Product

## Register

brand

## Users

Los invitados al cumpleaños, casi todos abriendo el link desde el celular, dentro de un chat de WhatsApp, en un momento cualquiera del día. No están buscando información: la reciben. No van a leer, van a deslizar.

El trabajo que vienen a hacer es doble y desordenado: enterarse de cuándo y dónde es la fiesta, y decidir en dos segundos si esto les da ganas. Lo segundo pasa antes que lo primero.

Hay un segundo usuario, Lucas, que necesita cambiar fecha, dirección o link sin tocar lógica.

## Product Purpose

Reemplazar el flyer de cumpleaños por un recorrido de seis pantallas que el invitado atraviesa hasta desbloquear el link del grupo de WhatsApp. Entrar al grupo es la confirmación: no hay formulario, no hay base de datos, no hay cuentas.

El éxito no se mide en visitas. Se mide en dos cosas: que el invitado entre al grupo, y que mande la invitación a otro para mostrársela.

## Brand Personality

Excesiva, precisa, cómplice.

Excesiva porque una invitación de cumpleaños no debería tener esto adentro, y ahí está la gracia. Precisa porque el exceso sin oficio es ruido: cada efecto tiene que estar bien hecho o el chiste se cae. Cómplice porque el hilo es Harry Styles y buena parte de los invitados son fans; los guiños se leen entre quienes los entienden, sin dejar afuera a quien no.

Tono de voz: el de un amigo que se pasó de entusiasmo organizando algo. Nunca solemne, nunca corporativo, nunca infantil.

La emoción objetivo es específica: **"¿cómo hicieron esto?"**. La invitación tiene que sorprender técnicamente, no solo verse linda.

## Anti-references

- **Invitación de boda formal.** Serif de bodas, marfil y dorado, centrado y ceremonioso, "tenemos el honor de invitarle". Es exactamente el registro opuesto.
- **Landing page corporativa.** Fondo blanco, azul, secciones prolijas, íconos redondeados sobre cada título, tarjetas iguales en grilla. Si se parece a un producto SaaS, falló.
- **Plantilla descargada.** Tipografía script dorada, marcos de flores, degradado rosa genérico.
- **Fiesta infantil.** Globos, emojis amontonados, colores primarios.
- **Editorial-magazine por reflejo.** Serif display en itálica, capitulares, columnas con filetes. Es la estética por defecto de la IA en 2026 y no tiene nada que ver con esta fiesta.

## Design Principles

1. **Cada pantalla es un mundo entero.** No hay una paleta del sitio: hay cinco eras y cada una se apropia del viewport completo. Avanzar tiene que sentirse como cambiar de disco, no como bajar a la siguiente sección.
2. **La información viaja adentro del espectáculo.** La fecha, la dirección y el link no son un pie de página debajo de la parte divertida: son el contenido de las pantallas divertidas. Si se puede sacar el dato sin ver el diseño, el diseño sobra.
3. **La restricción es el momento.** El navegador exige un gesto para reproducir audio. En vez de esconderlo, ese gesto es la aguja que cae sobre el vinilo y abre la invitación.
4. **El exceso tiene que estar impecable.** Bola de disco, reflectores, cuenta regresiva de odómetro: cualquiera de esos efectos mal hecho arruina el conjunto más que si no estuviera. Nada entra si no está terminado.
5. **El celular es el diseño, no la adaptación.** Se comparte por WhatsApp. La pantalla angosta y vertical es el lienzo real; el escritorio es el caso raro.

## Accessibility & Inclusion

- WCAG 2.1 AA en texto: 4.5:1 en cuerpo, 3:1 en títulos grandes. Se verifica sobre cada una de las cinco paletas de era, no solo sobre una.
- `prefers-reduced-motion` desactiva la deformación de lente, el barrido de reflector, el pulso de la bola de disco y la animación del odómetro. El recorrido queda con transiciones de opacidad y sigue siendo completo: nunca se pierde información por desactivar el movimiento.
- El audio jamás arranca solo. Botón de silencio siempre visible una vez iniciado, con el estado guardado entre recargas.
- El recorrido se navega con teclado (flechas y tabulación) además de con toque y deslizamiento.
- Toda la información crítica (quién, cuándo, dónde, link) existe como texto real en el DOM, no dentro de un canvas ni de una imagen.
