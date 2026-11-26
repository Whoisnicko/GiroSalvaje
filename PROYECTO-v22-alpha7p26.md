# Valley of Souls / The Crusader — v22-alpha.7.26

- User accepted previous visual phase; PREPARATION/AIM clipping deferred.
- First biome data registry; Valley retains current battlefield and neutral terrain. No other biomes implemented.
- Wave 5 newly generated Commander becomes The Crusader; wave 10 and legacy pre-generated queues unchanged. Existing Commander sprite reused.
- Consecrated Sweep: 56 px activation, fixed 68 px radius, 1.5 s warning, 80% basic damage, 8 s cooldown, root interrupts. Guardian and deployed Warlord damage uses existing damage pipeline, no Altar damage. Normal attacks and stats unchanged outside casting.
- Enemy details, inspector, Codex, sandbox integration. Optional plain JSON cast state, no save schema bump. No economy or HUD geometry change. Balance provisional; leaderboard scores across versions may differ.
- Source checks and isolated Node test supplied; full browser test and deployment validation pending.
