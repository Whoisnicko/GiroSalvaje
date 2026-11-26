# Playbook — Cursed Forest Regional Enemy Pack

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans

1. Ctrl+F5, verify v22-alpha.7.34. Guardian's Academy > Free Sandbox > hero > relic.
2. Select Cursed Forest, load waves 1, 2, 3 and 5; inspect wave details. Expected regional counts P/R/F: 1/0/0, 1/1/0, 1/1/1 and 2/2/2. No increase to total wave size.
3. Human selector: Pathfinder · Forest > Test enemy only > Start battle. Observe crossing Brambles without ordinary 30% slowdown; roots still stop it. 
4. Select Forest Ranger · Forest > Test enemy only. Place a guardian near Cover, ensure ranger can fire from a forward cover zone within search distance; observe movement and projectile protection. 
5. Select Forest Purifier · Forest > Test enemy only. Compare damage on a covered guardian and same guardian outside Cover, God mode off. Orange bolts ignore Cover; ordinary bolts do not.
6. Verify three entries in Codex and distinct P/R/F markers. Quick boss buttons and Valley wave queues unchanged. Report feedback on challenge and enemy distribution.
7. Automated rule regression: node tests/test_regional_enemies.cjs. Browser validation remains pending.
