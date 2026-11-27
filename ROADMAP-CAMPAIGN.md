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

## v22-alpha.7.39 — Cursed Forest Art Remake
User validated all six Frozen art checks and approved the new forest illustration. Replace forest backdrop with exact approved art resized to 1100×500 WebP. Realign two Cover and two Brambles zones to upper middle/lower left ruins/log and lower middle/upper right thickets; unchanged radii and effects. Other scenery decorative. Emerald altar already painted; align HP and glow without duplicate crystal. Cached static composition and fallback retained. Valley, Frozen, Sandbox and enemy stats unchanged. Next: regional sprite approval.

## v22-alpha.7.40 — Cursed Forest Enemy Art
v7.39 playtest 6/6; user approved three original regional designs. Transparent 288×96 PNG atlas, 96×96 cells, cropped from approved image. Generate 12-index idle/walk/attack poses with original engine timing and white/gray variants once at load, no per-frame generation; portraits used by wave HUD, inspector and Codex. Optional art per regional definition with original sprite fallback; common humans, Frozen and bosses unchanged. No changes to stats, behavior, queues, progression, HUD or maps. Next: Frozen enemy art approval.

## v22-alpha.7.41 — Frozen Wasteland Enemy Art
v7.40 playtest 8/8; user approved all three ice designs. Extract main character poses from approved composition, exclude presentation labels and example animation strip, scale into transparent 288×96 PNG. Shared regional installer preserves Forest frames and provides optional Frozen sprites, 12-index movement/attack timing, cached white/gray variants and matching portraits. No changes to stats, attacks, terrain, progression, HUD or bosses. Next: regional boss art approval.

## v22-alpha.7.42 — Regional Boss Art
v7.41 playtest 8/8; user approved all three boss designs. Extract the three main figures from the approved illustration, remove presentation panels and decorative background; transparent 480×112 PNG atlas, 160×112 cells with body-centered anchors. Existing animation system and optional original sprite fallback. Codex and HUD share the boss sprite resolver. Classic Commander, boss mechanics, region progression, maps and balance unchanged. Next: Ashen Kingdom concept and art approval.

## v22-alpha.7.43 — Ashen Kingdom
Fourth five-wave region unlocked by defeating Frozen Wasteland. Approved illustrated background, unique sprites, three burning zones, periodic ash cloud, Vanguard, Marksman, Priest and Iron Paladin. Nonstacking ground and bolt burn, attack buff, Molten Judgment residual ground. Independent local score and Sandbox/Codex. Balance provisional.

## v22-alpha.7.44 — The Fallen Cathedral
Ashen validated 15/15. Fifth region, five waves unlocked after Ashen; approved art and five sprites, three holy zones, bell shields, three exclusive enemies, two-stage High Exorcist. Desecrated Ground excluded (pending). Regional local scores, Codex and Sandbox. Provisional balance, browser validation required.

## v22-alpha.7.45 — Regional Rewards
Cathedral v7.44 validated 17/17. Five approved legendary starting relics, one existing relic slot, retroactive unlocks from regional profile and recorded victories, no Sandbox grants. Infernal Treasury, Codex and approved art atlas. Initial balance; actual playtest pending.

## v22-alpha.7.46 — Campaign Progression
Regional Rewards validated 15/15. New Game opens interactive map based on approved composition, live region states, real battlefield previews, sprites, relics, local short scores and progress. Original champion/name/classic/confirmation flow retained, no gameplay or schema change. Responsive sidebar and detail panel. Browser validation pending.

## v22-alpha.7.47 — Replayability I
v7.46 13/13 validated. Normal/Veteran/Nightmare regional difficulty (100/120/140% HP, 100/115/130% damage), persistent rank, per-tier local scores, old saves Normal, Classic/Sandbox unchanged. Contextual Back and Escape. Approved art, challenges, mastery medals/VFX, unified gothic buttons and meaningful higher-tier rewards reserved for Replayability II/III. Steam launch prize proposal recorded separately; no money/revenue share implementation.

## v22-alpha.7.48 — Replayability II-A / Global Balance handoff
User confirmed live 7.48 and 8/16 checks, no errors reported. Remaining 8 browser checks, II-B and III deferred by user (BACKLOG-REPLAYABILITY.md). Global Balance active. Source baseline captured; no gameplay changes. Next: Advanced Animations, Professional Polish, Steam Release & Marketing. Historical approvals preserved.

## v22-alpha.7.49 — Global Balance II
Guardian training conservation, live Banshee aura, resource protection for no-effect Sorcerer Barrier and Warlord War Cry/taunt. Base stats and mastery unchanged; targeted tests passed, browser and full regression pending. Replayability backlog preserved. Next: Global Balance III.

## v22-alpha.7.50 — Global Balance provisional lock / Advanced Animation I
User delegates balance and defers 7.49 browser playtest to combined validation. Regional stats/economy and difficulty unchanged; Classic late HP growth 32% instead of 46% starting wave 6. Existing queue/save and progression preserved. Directional guardian poses, frozen/reduced motion, reused bronze frame and menu transitions. Art originals not substituted. Advance animation and UI integration; backlog unchanged.

## v22-alpha.7.51 — Advanced Animation II
Role-specific procedural motion using shipped artwork; visual-only summon/fusion and bounded death snapshots, shared frame for overlays. No balance or save schema changes. Targeted source checks passed, browser validation pending; next Advanced Animation III. Replayability backlog and historical validations preserved.

## v22-alpha.7.52 — Advanced Animation III / Necromancy hotfix
7.51 user visual validation 7/7, one separate Necromancy issue recorded. Exact two-copy stack auto-evolution on blessing and safe legacy restore. Warlord pose, Sorcerer rune release, five boss windups/release. No other balance change. Browser confirmation pending. Backlog intact. Next UI Art Integration.

## v22-alpha.7.53 — UI Art Integration I
7.52 user playtest 7/7 approved, Necromancy correction confirmed. Static Warlord combat model and original Sorcerer runes in class selection, existing art frames and palette across secondary screens, Sanctum card and spell art. No gameplay/balance change; Dark Gate/map/HUD preserved by scope; original missing PNGs still pending. Browser validation pending. Next UI Art Integration II. Backlog unchanged.

## v22-alpha.7.54 — UI Art Integration II
7.53 user playtest 8/8 approved. Combat art pass: live inset meters, hold and winning indicators, card states, accessible labels and art fallbacks, corrected merge guide. Layout, mechanics, approved art and balance preserved. Targeted source checks passed; browser validation pending. Replayability backlog unchanged. Next UI Art Integration III.

## v22-alpha.7.55 — UI Art Integration III / Guardian facing
7.54 user playtest 8/8 approved; minor Zombie orientation bug reported. Visual target tracking, neutral reset and frozen pose fix; Grimoire/Hades states and themed outcome panels with actual campaign stats. No combat or balance change. Card splash art, design, variety and VFX explicitly deferred in BACKLOG-ART-CARDS.md; existing Replayability backlog untouched. Targeted source checks passed, browser pending. Next Advanced VFX (general combat effects; card-specific pass deferred).

## v22-alpha.7.56 — Advanced VFX I
7.55 user playtest 8/8 approved. Generic impact and projectile visuals refined with bounded draw budgets, local glow, minimal projectile fallback, reduced motion. No gameplay, card, save or balance changes; Card Overhaul and Replayability remain deferred. Targeted checks passed; actual browser FPS and visual validation pending. Next Advanced VFX II (regional/champion/boss effects).

## v22-alpha.7.57 — Advanced VFX II
7.56 functional 8/8, artistic 7/10; user requested more ambitious attacks and pixel art, and asked about unfinished original main menu/map assets. Regional ambience and five distinct boss pixel motifs, limited draw budgets, original telegraphs preserved. Original two PNGs located by Drive metadata; not yet extracted/integrated. Next Main Menu & Campaign Art Integration IV, then dedicated Attack & Pixel Art Overhaul before Professional Polish. Card Overhaul, Replayability II-B/III, historic checks and branching map/token backlog preserved. See BACKLOG-MAIN-MENU-CAMPAIGN-ART.md. Browser validation pending.

7.57 regression: 114/114 historical checks passed after updating only obsolete exact renderer cache-version assertion to a minimum version check; 32/32 new. No visual QA claim.
