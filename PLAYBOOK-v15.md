# Playbook — Giro Salvaje v15

## Enlaces del proyecto
- Cloudflare (juego público): PENDIENTE. No se publicó esta entrega.
- GitHub (repositorio/carpeta): PENDIENTE. No se identificó un repositorio confirmado para este juego.
- Drive: https://drive.google.com/drive/folders/1YsYnssNC7CeGpU8XDQXrujhDSOsrxYlD

## Ejecutar
Descargar index.html y abrirlo en un navegador moderno de escritorio. Para guardados estables se recomienda servirlo siempre desde la misma URL. El archivo incluye todo el arte; no necesita una descarga de assets para jugar. La tabla compartida necesita el despliegue descrito abajo.

## Checklist de aceptación
- Ingresar nombre, iniciar y elegir artefacto; comprobar monstruos, cartas y terreno.
- Girar, colocar unidades e iniciar combate; comprobar ataques y recompensas.
- Recargar durante preparación y durante combate; continuar y verificar oleada y unidades.
- Exportar partida, iniciar otra e importar el respaldo; verificar recuperación.
- Cambiar sonido, volumen, efectos y movimiento; comprobar persistencia al recargar.
- Terminar una partida; comprobar puntuación local, sin duplicado al recargar.
- Sin servicio online: comprobar mensaje claro al consultar/publicar; conservar marcas locales.
- Revisar pantalla pequeña, controles táctiles y audio en el dispositivo objetivo antes de dar la versión por aprobada.

## Habilitar ranking compartido (opcional)
Usar Cloudflare Pages para el sitio y D1 para la tabla. D1 es una base de datos gestionada. Publicar index.html junto a functions/api/scores.js mediante un flujo de Pages que compile Functions (Git o Wrangler; no asumir que arrastrar archivos en el panel compila las funciones).
1. Crear una base D1 para este juego y ejecutar schema.sql.
2. Vincular esa base al proyecto Pages con nombre DB; configurar también el entorno de vista previa si se usa.
3. Publicar y comprobar GET /api/scores: debe responder {"scores":[]} al comienzo.
4. Finalizar una partida y pulsar publicar; consultar la tabla desde otro navegador.
5. Añadir límites de solicitudes. Para una competición real haría falta validación autoritativa del combate y autenticación.
6. Completar aquí las URLs reales de Cloudflare y GitHub cuando existan.

No hace falta cuenta de jugador para esta propuesta. El apodo no es una identidad reservada. Continuar desde otro dispositivo se resuelve por ahora exportando/importando la partida; el ranking no sincroniza partidas.

Documentación oficial:
- https://developers.cloudflare.com/pages/functions/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/get-started/

## Rollback
Conservar el HTML v13 antes de reemplazar el sitio. Los guardados v15 usan claves gs14.*, separadas. Volver a publicar v13 revierte la interfaz; no convierte partidas v15 a v13.

## Compatibilidad
Se conserva el formato de guardado versión 14 y las claves gs14.* para permitir continuar partidas de v14 en el mismo origen. Esta entrega modifica la presentación, no las reglas.
