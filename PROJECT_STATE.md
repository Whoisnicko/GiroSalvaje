# PROJECT_STATE
Latest user-approved review: v22-alpha.7.58 (14/14 OK; art 8/10), branch review-ui-art-iv, 80de81b7d4f505829a70dcee394c6a26034b0352.
Latest candidate: v22-alpha.7.59, review-pixel-hud-i; awaiting browser QA and user approval. Production unchanged in this phase.
See PROYECTO-v22-alpha7p59.md, PLAYBOOK-v22-alpha7p59.md, LINKS-v22-alpha7p59.md, ROADMAP-CAMPAIGN.md and BACKLOG-* for preserved history.

## Production handoff — 2026-11-27
User explicitly requested direct publication to main for every candidate before playtest, replacing the review-only workflow. v7.59 and approved v7.58 fast-forwarded into main at b15791fa56b4c575179dfbaf3e486c24d2fa3d8c. Cloudflare production URL: https://stophumans.pages.dev/ ; deployment not independently verified. v7.59 playtest still pending; v7.58 remains last user-approved version. Preserve all historical validations and backlogs. For subsequent candidates, push main after technical checks, then request user playtest at production URL. Do not treat publication as approval.

## v7.60 candidate
# Stop Humans — v22-alpha.7.60 Front UI Correction I
27 Nov 2026. 7.59 user screenshots show inconsistent atlas overlays, missing icons, empty home screen margins, campaign detail clipping and scroll. 7.59 not approved; 7.58 is last approved. Scope: main menu and campaign only. New consistent 16-icon pixel-style SVG atlas, native labels, existing bronze frame, official title, original background and regional medals retained. Region/Mastery tabs preserve lore, enemies, boss, reward, medals and challenges. Difficulty, records, enter and scores live outside detail overflow; compact layouts switch map/detail/menu. Long detail may internally scroll at small heights, but actions remain fixed. Map fitted by aspect ratio. No campaign/save/balance changes. Source syntax and tests/test_campaign_map.cjs, tests/test_regional_challenges.cjs, tests/test_replayability_difficulty.cjs passed; real browser visual QA not performed. Production direct push requested; Cloudflare verification pending. Preserve 7.59 HUD, all previous tests and backlogs.
