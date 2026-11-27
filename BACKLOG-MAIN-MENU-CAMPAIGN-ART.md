# Main Menu & Campaign Art Integration IV — next phase

User v7.56: 8/8 functional approval, art 7/10. VFX and attacks still basic; pixel art should be more ambitious. User explicitly asked where designed main-menu and campaign assets went. v7.46 map integration and earlier Dark Gate title art are already present; approved compositions intentionally preserved during UI I–III, but final original button and medal integration incomplete. Both previously missing original files were located via Drive metadata on this pass:

- gothic_fantasy_ui_button_set.png — https://drive.google.com/file/d/1IdPHWegLMgcvYe6kJUtjl6UOhsD1wvaq/view (2,277,383 bytes reported).
- stop_humans_mastery_seal_reward_board.png — https://drive.google.com/file/d/1aHNFNbHJfpLta7F_IHr5cE_BtecMBjgp/view (2,525,059 bytes reported).
- Existing approved assets: assets/ui/dark-gate-approved.webp, assets/ui/stop-humans-official.webp, assets/campaign-map-v46.webp, regional battlefield WebPs, bronze frame.

Next phase: inspect actual source pixels; identify crop coordinates and state coverage; extract original art to usable sprites/frames; integrate into native menu buttons and campaign nodes while preserving text, keyboard, responsive behavior, progress and difficulty. No new mastery rewards or unlock mechanics; display only existing earned states. Do not claim asset integration until committed and browser-tested. Source metadata located, images not inspected or extracted yet. Replayability II-B/III and BACKLOG-ART-CARDS.md retained. Later dedicated Attack & Pixel Art Overhaul: authored attack sprite frames and distinct VFX sequences; review actual renders before production. Avoid pretending procedural marks are hand-animated sprites.

## 7.58 review candidate
Original sheets copied unchanged into repository; CSS crops match the original labeled buttons and all 20 medals. Native actions preserved. Grimoire, Warlord Talents and Academy keep their existing controls because no exact labeled originals exist. No new reward logic. Browser verification and approval pending; main remains on 7.57.

Roadmap: audio (music and SFX) before final visual overhaul; approve guardian and regional human unit designs, then author 4–5+ distinct animation poses per action, including Attack & Pixel Art Overhaul. Keep Card Overhaul and Replayability II-B/III open. Responsive behavior and prior regression suite mandatory.


## 7.67 user playtest — 2026-11-27
14/14 OK; art 7/10; evaluation Requiere mejoras. Working baseline accepted provisionally; no final artistic approval. Regional rewards placement and asset linework/edges deferred to Final Polish, preserving all prior home/campaign pending work and all historical validations. See VALIDATION-v22-alpha7p67.md for exact results. Next recommended: Audio Integration I, pending confirmation; no runtime changes in this handoff.
