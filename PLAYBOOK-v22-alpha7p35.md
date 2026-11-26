# Playbook — Sandbox Damage Clarity

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans

1. Ctrl+F5; verify v22-alpha.7.35. Enter a new Free Sandbox, select hero and relic. Header should say DAMAGE ON. Add a guardian and choose Fight The Grand Huntsman.
2. Observe basic bolt damage and Hunter's Mark against a guardian staying in the marked circle. Cover reduces both; shields may absorb hits. The mark does not damage the altar, but normal bolts do. Toggle God mode ON; header should show IMMUNE and HP remains unchanged. Toggle OFF to restore damage. Guided Academy still begins protected. No need to re-test all regional enemies.
3. If damage is still absent with God mode off, report target (guardian, Warlord or altar) and attack (basic bolt or Mark), and whether a shield is active. Run node tests/test_huntsman_damage.cjs.
