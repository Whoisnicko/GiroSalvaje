# Stop Humans! v16 — Playbook

## Scope
English localization, bronze-and-stone responsive UI, menu rebrand, summoning grid, retained game rules. Art is the v15 battlefield/atlas, not the concept mockup. Save schema 14 and localStorage keys retained; legacy reward names mapped on restore.

## Files
- index.html: HTML shell and legacy styles
- ui-v16.css: new presentation overrides
- game-v16.js: game logic and English interface
- assets/battlefield.png, assets/hybrid-atlas.png, assets/valley.webp: original v15 art
- functions and schema.sql: unchanged

## Deploy
Cloudflare Pages: connect https://github.com/Whoisnicko/GiroSalvaje, branch main, framework None, no build command, output directory repository root. Public URL not verified. D1 binding for shared scores remains separate.

## Tests
JavaScript parser passed. Browser QA pending: new run, relic, spin/hold, drag/merge, combat, settings, restore a v15 save, mobile and desktop layout, leaderboard fallback. For rollback revert v16 commit.
