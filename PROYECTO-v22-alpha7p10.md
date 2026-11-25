# Stop Humans! — v22-alpha.7.10 HUD & UX overhaul

Implementation of approved concept using real HTML/CSS/canvas, original assets and bronze frames. Logo and class join the top command bar, mana/rage and all existing spell controls remain available, counters grouped at right, left Soul Gacha/DEFEND/Hades, map unobstructed, centered fan hand with current card art and phase-specific instructions, decorative reserve frame with real canvas slots, right invasion and artifact panels, bottom menu and audio. No mockup background, invented card costs, combat balance changes, save-schema changes or new game mechanics. Long hands, spell lists and expanded information can scroll internally; smaller viewports keep responsive fallback. Existing saved world dimensions are preserved, so map scale varies with aspect ratio.

Local actual-engine Chromium test with available original sprites/background and simulated localStorage: 1280×720, 1366×768, 1852×757, 1920×1080 no page overflow, three cards fit vertically; 1852×757 canvas 1380×499 (battlefield approximately 1380×403). Both classes, drag to reserve and back, restore snapshot, Hades and Bestiary open/close, single lever spin passed, no JS errors. Some secondary art uses built-in fallback in local test. Complete combat, durable storage and live Cloudflare deployment not verified.

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans
