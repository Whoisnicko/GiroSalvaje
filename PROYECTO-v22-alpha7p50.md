# v22-alpha.7.50 — Global Balance provisional lock & Advanced Animation I

User delegates balance decisions and requests advancing visual work before further player tests. Preserve 7.49 changes; its browser validation not reported, defer to combined playtest. No Replayability backlog item removed.

## Global Balance
Base regional five-wave curve, tier multipliers, boss abilities, economy prices, guardian stats, masteries and doctrines unchanged. Reason: 7.48 baseline and historical regional approvals; no full combat evidence for arbitrary changes. Classic waves 6–10: 32% HP growth per wave instead of 46%, from unchanged wave 5 baseline. Damage, counts, speed, armor unchanged. Applies to newly generated queues, not saved current/next enemy queues. Local historical scores retained; changed Classic balance means old and new scores are not strictly comparable. No competitive prize verification until server-side validation. Calculation (base soldier HP):
|Wave|Old|New|Reduction %|
|---|---:|---:|---:|
|1|20|20|0|
|2|29.2|29.2|0|
|3|42.63|42.63|0|
|4|62.24|62.24|0|
|5|90.87|90.87|0|
|6|132.68|119.95|9.6|
|7|193.71|158.34|18.3|
|8|282.81|209.01|26.1|
|9|412.91|275.89|33.2|
|10|602.85|364.18|39.6|

## Advanced Animation I / UI foundation
Reuse existing art atlases and shipped bronze pixel-edged frame asset. Guardian movement/attack direction drives horizontal flip without altering gameplay positions; enemy sprites retain original orientation; frozen and reduced-motion poses stop bobbing/rotation/lunge, fallen grayscale pose retained, reserve badge uses rounded training percentage. Native UI labels/controls remain live. Bronze frame shared by secondary menu panels, selected navigation buttons and hero cards; subtle 180ms screen fade, 120ms hover transition, reduced-motion via both game and OS. Existing Dark Gate painted button alignment untouched; no generated mockups. No original new hand-drawn frame sheets, champion portraits, mastery PNGs or gothic button atlas recovered; defer exact integration. Full visual/browser review pending. 27 targeted source checks in JS isolate.
