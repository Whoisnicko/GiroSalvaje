# V7.74 — Matched combat balance report (2026-11-28)

Runtime tested: 26fc6462cbdb24fc81d673e5beb9d4af5851b8e9. Preview only. Main remains a4903620c0ec67fe52b49708980854753c6ddcbb.

## Method
510 paired cases / 1,020 simulated encounters. Five regions, three difficulties, waves 3 and 5, two seeds, eleven formations (six formations on both waves; five solo-III formations on wave 5). Actual combat update, wave generation, guardian stats, regional rules and Ascension module. Hero, cards, relics, graphics, audio and UI stubbed. Each pair starts with identical seeded queue and entry positions; compare Ascension enabled vs disabled on same runtime, not separate production builds. 97 isolated assertions previously passed. No timeouts. This is not a browser/performance or complete campaign test.

| Formation | Pairs | Wins off | Wins on | Mean seconds off | Mean seconds on |
|---|---:|---:|---:|---:|---:|
| Mixed | 60 | 60 | 60 | 18.60 | 18.60 |
| All III | 60 | 60 | 60 | 9.94 | 9.90 |
| All II | 60 | 47 | 47 | 22.37 | 22.37 |
| Support | 60 | 60 | 60 | 14.76 | 14.12 |
| Weak support | 60 | 60 | 60 | 16.21 | 14.18 |
| Front III | 60 | 60 | 60 | 17.26 | 14.61 |
| Zombie III only | 30 | 4 | 3 | 41.44 | 41.43 |
| Wraith III only | 30 | 20 | 21 | 26.53 | 25.95 |
| Dragon III only | 30 | 30 | 30 | 18.99 | 18.97 |
| Necromancer III only | 30 | 1 | 3 | 23.74 | 26.44 |
| Banshee III only | 30 | 0 | 0 | 23.07 | 24.55 |
| Total | 510 | 402 | 404 | — | — |

All 60 Tier II pairs exactly matched wins, times, altar HP, losses and kills; zero Ascension casts. Necromancer raises never exceeded six. All five skills activated in the matrix. Overall win rate 78.82% off / 79.22% on. Stronger lineups show a ceiling effect; sample does not establish comprehensive campaign balance.

## Open balance item: Zombie III
Valley Veteran, wave 5, seed 17, soloW formation: off wins at 51.7s, altar 80, three losses, eleven kills; on loses at 50.1s, altar 0, five losses, nine kills. Diagnostic rerun with only slow set to 0 and plague damage unchanged restores baseline win at 51.7s, altar 80. Slowing changes timing/positioning in this case; exact tactical sequence not independently verified. Keep approved 15% slow in preview; do not silently change. Production gate remains open pending browser playtest and resolution/acceptance of this case. Bone Guard deferred, Werewolf unchanged. Existing sprite motion retained; new VFX, not hand-drawn animation frames.

## Reproduce
node tests/test_guardian_ascension_balance_v74.cjs
Full paired results: tests/results/guardian-ascension-v74.json.
Browser comparison: https://preview-guardians-v72.stophumans.pages.dev/ and ?ascension=off (separate profiles for saves). Production: https://stophumans.pages.dev/.
