# Global Balance I — source baseline (v22-alpha.7.48)

No gameplay parameter changes. Seed 20261126; 5000 actual rollWave calls per region/wave (125000 queues), 200000 fresh independently randomized 3×3 grids, 75 paired region/wave/tier comparisons. This measures queue stats and unheld slot outcomes, not fight results, player strategy, or win rates. Enemy attack sum is not DPS. Historical user-approved builds preserved.

## Enemy growth
|Wave|Enemies including boss|Soldier HP|Base attack|
|---|---:|---:|---:|
|1|9|20|8.45|
|2|11|29.2|10.4|
|3|14|42.63|12.35|
|4|16|62.24|14.3|
|5|11|90.87|16.25|
|6|22|132.68|18.2|
|7|24|193.71|20.15|
|8|27|282.81|22.1|
|9|29|412.91|24.05|
|10|16|602.85|26|

## Regional wave 5 (Normal)
|Region|Mean total enemy HP|Mean sum of attack values|Boss HP|Boss attack|
|---|---:|---:|---:|---:|
|valley|2236.71|186.96|1272.24|35.75|
|forest|1785.11|172.01|954.18|28.6|
|frozen|2348.47|182.37|1272.24|35.75|
|ashen|2327.48|185.55|1272.24|35.75|
|cathedral|2358.93|185.65|1272.24|35.75|

## Fresh slots
```json
{
  "samples": 200000,
  "hitPct": 60.25,
  "zeroPct": 39.75,
  "meanLines": 1.103,
  "meanUnits": 0.94,
  "meanSouls": 0.57,
  "jackpotPct": 0.019,
  "threeIndependentMissPct": 6.28
}
```

## Guardians (no buffs, single-target base DPS)
|Guardian|HP ★ / ★★ / ★★★|DPS ★ / ★★ / ★★★|
|---|---|---|
|Zombie|144 / 461 / 1440|6 / 22.35 / 85.71|
|Wraith|20 / 64 / 200|5.56 / 20.92 / 79.37|
|Dragon|22 / 70 / 220|4.71 / 17.99 / 67.23|
|Necromancer|30 / 96 / 300|0 / 0 / 0|
|Banshee|28 / 90 / 280|0 / 0 / 0|

## Priorities for combat calibration
1. Classic wave 6–10: soldier HP grows 46% per wave while ordinary guardian tier values are static; measure summons, fusions, cards, hero and reserve before changing curve. Wave 5/10 boss count lower than preceding wave. No inference of impossibility.
2. Fusion: 3 copies -> x3.2 HP/damage and 0.85 attack interval; 9 copies -> x10 HP/damage and 0.7 interval. Necromancy reduces recipe to 2 copies, reserve trains +50% HP/damage per wave to +150%, strongest inherited on merge. Test compounding before nerfing.
3. Economy: 1 soul per original kill; 3 initial spins/wave, purchased spins 4/6/8..., slots 10/16/22..., cards 5/8/11... per wave. Artifact Fortune Charm costs 14, adds one spin now and every future preparation. Route choice adds rewards/discounts; timing matters. No price changes.
4. Region identity: same count and soldier curve; Huntsman lower HP/attack than other bosses with ranged ability; hazard effects not quantified by raw HP. Test both heroes, compare altar HP, clear time, guardian falls, economy, build choice.
5. Proposed calibration: Normal accessible with coherent builds, Veteran rewards deliberate placement/resource choices, Nightmare requires mastery without compulsory build. Avoid multiple system changes at once. Separate first-run vs veteran profiles.

## Reproduce
node tests/global-balance-baseline.cjs
Script executed with a filesystem adapter in V8. Full Node/browser combat tests pending. No gameplay changes.
