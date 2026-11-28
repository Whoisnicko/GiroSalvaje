# V7.74 — Guardian Ascension preview
Implemented five automatic Tier III skills with cooldowns W8/A6/M9/N12/B12 and first readiness at 3s. W plague, A swept three-target projectile, M outer ring, N extra corpse summon respecting cap and free position, B nonstacking debuff. Bone Guard deferred for a separate balance gate. Base stats unchanged. Existing sprite poses retained; new VFX rings/shot colors and sandbox cooldown/diagnostic display. Baseline flag ?ascension=off; use separate browser profiles for campaign comparison. 97 isolated assertions passed. Full browser and matched campaign balance not yet verified. No production merge.


## Balance validation update
510 matched pairs (1,020 encounters), 402/510 wins without versus 404/510 with Ascension. 60 Tier II pairs identical; no timeouts; Necromancer cap preserved. One Zombie III regression in Valley Veteran isolated to 15% slow; retains approved value pending playtest/decision. See BALANCE-v22-alpha7p74-PREVIEW.md and tests/results/guardian-ascension-v74.json. Browser and Cloudflare delivery unverified. No production release.
