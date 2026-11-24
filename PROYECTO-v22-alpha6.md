# Stop Humans! v22-alpha.6 — Class Balance

Static balance pass, not measured campaign win rates. Enemy HP grows 1.46x per wave; hero output previously mostly flat. First three waves unchanged. From wave 4 onward, shared direct damage multiplier 1+0.18*(wave-3), Warlord max HP multiplier 1+0.12*(wave-3), capped wave10. Apply to basic, Descent, Cleave, Bloodstorm per pulse, Retaliation, fire (after existing additive/tier scaling), lightning per strike and tier III burn. No scaling to shields, control, harvest, Rage, mana, durations, cooldowns, Cry, army, enemy stats or economy. Existing doctrine percentages remain; rounding per hit. Restore old active hero HP by fraction of previous max HP, do not multiply twice. Taunt cooldown normalized using effective doctrine data. Sandbox wave selector refreshes hero. HUD/Grimoire reflect actual wave damage. Tests: actual source calculation for 10 waves, old-save HP, cooldown, regression harnesses; no full battle playtest or Cloudflare verification.

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans
