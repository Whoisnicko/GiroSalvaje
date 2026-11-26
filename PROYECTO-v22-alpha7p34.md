# Cursed Forest Regional Enemy Pack — v22-alpha.7.34

User approved the three proposed forest units after deferring further art/performance work. Implemented registry-driven enemy types with guaranteed wave slots replacing ordinary humans; total wave count remains unchanged.
- Pathfinder: 0.65× wave HP, 0.75× attack, 1.65× speed, radius 10, melee; bramble immunity only, other slows/roots still apply.
- Forest Ranger: 0.8× HP, 0.85× attack, 1.05× speed, range 150; seeks nearby forward Cover within 115 px when able to attack from its center. Respects roots, forced hero target and final charge. Normal cover reduction.
- Forest Purifier: 1× HP, 0.95× attack, 0.8× speed, range 120; orange bolts bypass Cover only, ordinary altar damage. Other defenses unchanged.
Guaranteed slots by wave (Pathfinder/Ranger/Purifier): 1/0/0, 1/1/0, 1/1/1, 2/2/1, 2/2/2. Existing random pool fills remaining slots. Valley, classic Commander and Huntsman definitions unchanged. Old saved queues remain intact; newly generated forest waves use new units. No schema migration.
Existing sprites reused with P/R/F badges and orange Purifier bolt palette. Infernal Codex, tactical wave details and inspector updated. Sandbox human selector includes all three; Test enemy only automatically loads their region at current or first valid wave, retaining army. Add enemies rejects regional units on Valley.
Source syntax and isolated rules checked; exact wave counts 1–5 forest and no regional units in Valley 1–10, cover search, immunity and bypass verified. Browser behavior, balance, visual quality, deployment and performance not verified. Stats provisional. Next: Frozen Wasteland after functional validation.
