# Stop Humans! — Roadmap de campaña y metaprogresión
Fecha: 2026-11-25 | Estado: diseño propuesto, no implementado | Base: v22-alpha.7.12

## Dirección confirmada por el usuario
- Convertir la secuencia de oleadas en una campaña roguelite con mapa ramificado, lugares que ofrecen mejoras y decisiones de ruta.
- Mostrar al héroe o un vehículo temático desplazándose por el mapa tras cada oleada.
- Considerar Hades Room / Hades Vault como parada específica en vez de tienda siempre disponible; rediseñar la economía en consecuencia.
- Agregar una sección en el menú inicial para consultar desbloqueos, mejoras permanentes, requisitos pendientes y ventajas elegibles para futuras campañas.
- Guardar el progreso durante la campaña y entre campañas.
- Mantener el trabajo por fases, el tutorial visual y el futuro HUD/UI overhaul. No sustituir arte o mecánicas existentes sin validación.

## Propuesta de diseño (pendiente de aprobación)
### The Underworld Journey
Tras cada oleada: resultado → mapa → elección de ruta → animación de viaje → interacción del lugar → preparación → siguiente combate. Empezar con las 10 oleadas existentes y dos rutas entre combates, sin multiplicar la duración de la partida. Las rutas convergen antes de jefes. Mostrar beneficios/riesgos antes de elegir. El mapa se genera una vez por campaña y conserva sus elecciones.
Ficción sugerida: un altar móvil sobre un carro ritual, escoltado por el campeón, transporta el cristal y el ejército por el inframundo. Alternativa: héroe como ficha animada sobre el mapa; estética oscura y assets existentes cuando sea posible.
Nodos posibles: Hades Vault (compras), Soul Shrine (almas), Forgotten Forge (mejoras/infusiones), Crypt (reclutamiento), Sanctuary (curación/entrenamiento), Cursed Encounter (riesgo y premio), Elite Battle (opcional a definir), jefe. No todos tienen que entrar en la primera versión.
Hades: reservar artefactos/infusiones y pergaminos para visitas; no retirar acceso actual hasta balancear frecuencia, precios y fuentes alternativas de mejoras. Conservar tiradas, cartas y capacidad comprables durante preparación como propuesta inicial. No duplicar automáticamente recompensas actuales de oleada y nuevas recompensas de nodos.

### The Eternal Sanctum (nombre provisional)
Centro de progresión permanente en menú principal: cartas, reliquias iniciales, héroes/talentos, hechizos, desafíos y colección de criaturas. Mostrar desbloqueado, bloqueado, requisito, progreso y equipado. Diferenciar colección/descubrimientos de mejoras que sí afectan al juego. Propuesta: moneda permanente independiente de Souls (nombre provisional: Eternal Embers), obtenida por hitos verificables y cierre de campaña, incluida derrota; evitar que grind sea necesario para ganar. Priorizar opciones horizontales y un número limitado de ventajas iniciales; valores, moneda y reglas de ranking pendientes. Reutilizar deck, spell knowledge y Warlord talents ya existentes, sin eliminar sus guardados.

## Persistencia y arquitectura
Separar CampaignState (ruta/semilla, nodo, recompensas reclamadas, oleada, héroe, ejército, reserva, mano, mazo, almas, reliquias, artefactos, estado del combate según soporte) de ProfileState (desbloqueos, talentos, conocimiento, moneda permanente, colección, loadout e hitos). Guardado versionado, migración de campañas previas, backups export/import y reanudación en puntos seguros: fin de oleada, elección de ruta, resolución de nodo, preparación. Recompensas idempotentes: no duplicarlas por recarga. Definir política de guardado durante combate y de abandono; no prometer guardado cloud o sincronización entre dispositivos sin backend. Separar puntuaciones si las ventajas permanentes afectan competitividad. Mantener el perfil local existente y sus desbloqueos.

## Orden de implementación propuesto
1. Tutorial 3.0: motor de demos reutilizable, fusión, Undo, tiradas extra y slots; resto de mecánicas después.
2. Base de campaña y guardado: estados, migración, puntos de reanudación, pruebas de regresión. Antes de modificar economía/UI de campaña.
3. Mapa navegable: dos rutas, pocos nodos, desplazamiento animado, retorno a combate. Primero con arte real/fallback y sin reescribir combate.
4. Eventos de ruta y economía: Hades Vault, recompensas, curación y mejoras; balancear acceso a tienda y recompensas existentes.
5. Eternal Sanctum: catálogo y progreso, integración de desbloqueos actuales; posteriormente moneda y ventajas iniciales equilibradas.
6. HUD & UI overhaul: consolidar interfaz sobre el flujo de campaña estable; arreglos de usabilidad críticos pueden hacerse antes.
7. Guardian's Academy e Infernal Codex: práctica aislada y consulta; actualizar tutorial para enseñar mapa y metaprogresión.
8. Sinergias, escenarios/biomas, jefes, Game Feel y balance/playtesting de campaña completa.

## Decisiones abiertas
Vehículo/hero marker, biomas, frecuencia de Hades, tipos de nodos, cuándo cambia escenario, recompensas, moneda y ritmo de desbloqueo, cantidad de ventajas iniciales, política de ranking, duración del viaje y alcance de guardado en combate. No se fijan números económicos nuevos hasta probar.

## 2026-11-25 — Layout lock (user decision)
The v22-alpha.7.19 Command Center layout was rejected. Restore v22-alpha.7.18 runtime, including the exact hand, reserve and control positions at each responsive breakpoint. Do not move or resize/reflow existing HUD zones, card fan, reserve or controls without explicit approval. Non-layout readability fixes may be proposed; validate against the approved baseline. Defer the HUD redesign until final polish. Next: Guardian’s Academy, then Infernal Codex, synergies, biomes/bosses, polish and balance. Short 5-wave campaign remains default, Classic 10 optional; Eternal Sanctum and route economy remain intact.

## v22-alpha.7.21 — Guardian's Academy
Six guided exercises and original Free Sandbox integrated, with session-only completion. Pending user playtest. Campaign HUD layout remains locked. Next: Infernal Codex. No permanent rewards from training.

## v22-alpha.7.22 — Asset Recovery
Hotfix: static original sprites and illustrations with direct decoded image rendering and visible fallbacks; no layout or gameplay change. Academy retained. Infernal Codex deferred until graphics recovery is confirmed in production.

## v22-alpha.7.23 — Infernal Codex
User confirmed v7.22 artwork recovery. Read-only Codex: 75 entries across guardians, invaders, cards, relics/artifacts/infusions/blessings, heroes/spells/skills/talents. Wave reference selector (1–10), search, rank comparison and original artwork. Base stats reuse runtime formulas with explicit neutral modifiers; no profile or run mutation. Existing HUD layout locked. Next: Monster Synergies after Codex playtest. Full spell mastery details remain in Grimoire; permanent unlock management remains in Eternal Sanctum.

## v22-alpha.7.24 — Monster Synergies
User confirmed v7.23. Three derived spatial synergies (Boneguard, Spectral Choir, Ash Ritual); live bestiary markers and Codex references. No save migration or HUD relocation. All runs receive the changes; balance and score comparability require review. Next Biomes & Bosses after playtest.

## v22-alpha.7.26 — Valley of Souls / The Crusader
User accepted v7.25; PREPARATION/AIM overlap is non-blocking, deferred to final polish. First biome registry and wave-5 boss variant, using existing art and battlefield. No HUD reflow, new terrain rules, reward, or save version. Legacy pre-generated queues unchanged. Further biomes, balance and unique art pending.

## v22-alpha.7.27 — Regional progression / Cursed Forest
User validated Crusader mechanics and selected option B: independent five-wave regional campaigns. Forest unlock is a durable monotonic profile flag after valley wave 5 victory outside sandbox; legacy profile defaults locked. Forest uses original field with deterministic drawn forest zones, symmetric projectile cover and walking slow, distinct wave-5 Huntsman with marked fixed-position volley. No permanent traps, unique assets or forest-only normal enemies yet. Classic valley 10 remains and rankings stay separate. Next: playtest and balance before more regions.

## v22-alpha.7.28 — Sandbox Encounter Director
User requested immediate access to maps, waves and bosses. Free Sandbox exposes registry-driven region and boss selectors, load/play, and retry. Boss-only fights choose native region and wave automatically; full waves retain normal enemy queues. Switching while fighting resets transient state and retains army. No profile unlocks, ranking or campaign HUD changes.

## v22-alpha.7.29 — Sandbox boss routing hotfix
User reports Huntsman selection leads to Crusader. Boss dropdown now loads on change; top direct boss buttons route by immutable boss ID and immediately fight. Active map/wave/boss is shown from the real queued/spawned enemies. Validate exact runtime routing and preserve Academy/campaign isolation. Browser production reproduction pending.

## v22-alpha.7.30 — Region and boss identity
User confirmed Quick Boss access for Crusader and Huntsman; forest looked like Valley, classic Commander looked like Crusader, title version stale. New cached procedural forest backdrop replaces Valley art in forest only. Crusader uses existing Knight art; Commander retains original art; named boss labels distinguish all three. Version rendered from a single HTML meta value. No boss stat, campaign layout, routing or save changes. Browser playtest pending.

## v22-alpha.7.31 — Cursed Forest visual art pass
User validated all v7.30 changes; feedback: forest visually inferior, old wall instead of crystal. Dedicated 1100×500 SVG art composes cropped original textures, recolored crystal, winding woodland path, moss, roots, foliage, bramble and cover motifs. Cached image loaded with existing bounded loader; procedural forest and drawn crystal fallback. Lower tactical overlay opacity; no geometry or balance changes. Valley and boss routing untouched. Await visual playtest before further biomes.

## v22-alpha.7.32 — Performance hotfix
User accepted forest art as sufficient but reports low fluidity/game feel and map dropdown mismatch. Bake SVG into a raster canvas at load, cache terrain geometry, skip zone lookups in Valley, make region dropdown load map immediately and preserve/clamp wave, show measured FPS/worst frame interval in free Sandbox. No combat balance or art change; no new region until performance validated. Next: regional enemy packs.

## v22-alpha.7.33 — Static forest render cache
User validated v7.32 dropdown and effects; Forest still feels slower and FPS hidden below scroll. Composite static forest raster and tactical markings once per logical dimensions, draw as one bitmap, disable interpolation in hot path. FPS moved into Sandbox summary, visible when collapsed, fixed-width. No timing/FX/terrain changes. Real performance unverified; user requests proceeding with content, further art/perf work deferred unless major blocker. Next: regional enemy packs.

## v22-alpha.7.34 — Regional enemy pack: Cursed Forest
Three forest-only units (Pathfinder, Forest Ranger, Forest Purifier) replace guaranteed slots without increasing wave sizes. Data-driven counts, cover-seeking ranger, Brambles immunity only for pathfinder, flaming cover-piercing bolts for purifier. Existing sprite art with P/R/F markers, Codex and Sandbox solo tests. Stats provisional. Valley and bosses unchanged. Next: validate pack, then Frozen Wasteland.

## v22-alpha.7.35 — Sandbox damage clarity
User approved all regional enemy checks but reported Huntsman not damaging targets. Real damage-path test confirmed both basic bolt and Hunter’s Mark deal damage when God mode is off and deal zero HP damage when on. Free Sandbox now starts with damage enabled; guided Academy remains protected, selected mode persists across encounters. God toggle moved to quick boss row, DAMAGE ON / IMMUNE indicator in summary. No boss balance changes. Pending browser confirmation; then Frozen Wasteland.

## v22-alpha.7.36 — Frozen Wasteland
Third five-wave campaign; Forest completion unlocks permanently, independent local ranking. Ice inertia, periodic blizzards, three regional enemies and Frost Inquisitor (Glacial Prison). Cached procedural ice art and blue crystal. Sandbox and Codex integrated. Stats and art provisional; browser playtest pending.

## v22-alpha.7.37 — Sandbox Launchpad
User approved control deck prototype and preconfiguration workflow. Preselect region, wave/boss/enemy, army preset, relic, damage and auto-start, then existing champion/doctrine. Reconfigure encounter without leaving sandbox or changing campaign. Compact toolbar and four advanced tabs, filtered regional roster. No artwork or combat changes. Approved Frozen art and Forest remake deferred to next art phase.

## v22-alpha.7.38 — Frozen Wasteland illustrated art
User approved all eleven Launchpad checks. Integrate the exact previously approved ice background, converted to 1100×500 WebP; keep ice hitboxes and dynamic indicators; avoid a duplicate drawn altar. Cache the static composite, preserve procedural fallback, no balance/UI changes. Binary asset uploaded and verified byte-for-byte before merging to main. Forest remake and exclusive sprites remain subsequent art approval phases.
