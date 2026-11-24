# Giro Salvaje v15 — Guardianes del Altar

## Dirección aprobada
Unidades con lenguaje visual B (16 bits expresivo) y habilidades de D (32 bits detallado), tomando como referencia Spectral calligraphy: four pixel-art battle styles.png. Regreso a fantasía oscura sobria. Se elimina la parodia de v14.

## Cambios
- Atlas nuevo con 16 figuras: proporciones naturales, colores desaturados, sin sonrisas ni caricaturas.
- Escenario nuevo de ruinas, montañas y terreno oscuro.
- Cortes cian de núcleo luminoso, garras magenta, magia violeta y fuego naranja contrastan con las unidades.
- Menú, títulos y mensajes serios; se elimina la opción de humor y los globos cómicos.
- Conserva iniciar, continuar, ajustes de sonido y movimiento, exportar/importar y puntuaciones locales.
- Conserva reglas y formato de guardado v14. La numeración de edición visual es v15.

## Implementación
HTML autocontenido con imágenes integradas y fallbacks. Los sprites se reducen a un máximo de 43x44 píxeles y se renderizan sin suavizado. Tienen 12 fotogramas procedurales por figura (reposo, movimiento y ataque), no poses dibujadas individualmente. 16/32 bits describe la estética, no la profundidad de color del navegador. El juego sigue usando Canvas y JavaScript; no se migró de motor.

## Validación
Pasaron pruebas de carga de atlas, 192 fotogramas, partida nueva, guardado/restauración, referencias de proyectiles, recompensas, combate simulado, puntuación sin duplicados, escape HTML y opciones. Se inspeccionó el dibujo real de Canvas. No se pudo completar una prueba interactiva de interfaz, audio y móvil en navegador debido a la restricción de Chromium del entorno.

## Publicación
No se creó repositorio ni se desplegó el juego: el usuario indicó hacerlo después de esta entrega. El paquete incluye el servicio opcional de puntuaciones y esquema D1 de v14. Sin conexión a base de datos, el ranking es local. El ranking compartido propuesto es casual, no resistente a trampas.

## Siguiente fase
Confirmar presentación jugable; crear el repositorio GitHub y conectarlo a Cloudflare. Registrar las URLs reales en PLAYBOOK-v15.md y LINKS.md.
