# Playbook — Asset Recovery
Production: https://stophumans.pages.dev/
Repository: https://github.com/Whoisnicko/StopHumans (main)
1. Export save if desired; never clear site data. Refresh Ctrl+F5 and verify 7.22.
2. Continue; verify guardian and human sprites, card illustrations, Soul Gacha symbols, reserve and fusion animations. Check Academy.
3. If graphics remain missing, try a private window without deleting existing save data. Record browser version and console/network errors; verify deployment status and the new assets/baked-v22 PNG files.
4. Run python tests/test_art_visibility.py, python tests/test_academy.py and python tests/test_responsive.py in repo (Pillow, Chromium, Playwright). Original art source and legacy generation code: commit 5690b023d1ad326a0d2f1c3465c8cf6016cce5ae. Preserve layout lock.
