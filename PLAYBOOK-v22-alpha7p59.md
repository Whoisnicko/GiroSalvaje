# Playbook — v22-alpha.7.59
# Stop Humans v22-alpha.7.59 links
Production baseline (not changed): https://stophumans.pages.dev/
Review branch: https://github.com/Whoisnicko/StopHumans/tree/review-pixel-hud-i
Cloudflare preview: unverified; select branch review-pixel-hud-i in Pages > Deployments.
Drive: https://drive.google.com/drive/folders/1TxAeu0S7SySTQlCC9HuMsQhhYv6gJW0f

## Playtest
Confirm build v22-alpha.7.59 before testing.
- Desktop 1920×1080 and 1366×768: HUD legible, altar/cards/field/skills visible.
- Tablet 768×1024 and mobile 375×667/390×844: Altar/Cards/Intel switches; battlefield remains accessible, no page-length scrolling.
- Short landscape: battlefield not clipped; active controls reachable.
- Main menu, campaign, champion selection, settings, Treasury, Codex, Sanctum, Academy, Grimoire, talents, Hades and results: controls reachable; long lists scroll inside panel.
- Both classes, summoning, holding, dragging/merging, reserve, cards and rune aim, tutorial, sandbox, saves and VFX: unchanged.
- Missing image fallback and keyboard focus; no loss of progress or rewards.
- Art rating /10 and approval.
- Confirm the compact footer retains autosave status and the original Main menu button returns to menu.

## Production handoff — 2026-11-27
User explicitly requested direct publication to main for every candidate before playtest, replacing the review-only workflow. v7.59 and approved v7.58 fast-forwarded into main at b15791fa56b4c575179dfbaf3e486c24d2fa3d8c. Cloudflare production URL: https://stophumans.pages.dev/ ; deployment not independently verified. v7.59 playtest still pending; v7.58 remains last user-approved version. Preserve all historical validations and backlogs. For subsequent candidates, push main after technical checks, then request user playtest at production URL. Do not treat publication as approval.
