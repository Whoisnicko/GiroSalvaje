# Stop Humans v22-alpha.7.70
Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans/tree/main
Drive: https://drive.google.com/drive/folders/1TxAeu0S7SySTQlCC9HuMsQhhYv6gJW0f

## Playtest
Confirm version 7.70. Valley prep and battle recordings, boss music on spawn in all regions, return to regional normal music when boss defeated, victory/defeat/menu, volume/mute, tab suspend/resume, save, responsive credits. Other region regular themes and SFX unchanged. Check loading fallback by blocking an audio request; no crash. Rate musical quality, repetition, transitions and performance. Battle March is 11 seconds; boss MP3 is original full version, not seamless loop master. No further rollout until approval.

## Additional verification
Actual Chromium OfflineAudioContext decoded and rendered all three local assets after reassembly (3/3): prep 236.355918 s, battle 11.294150 s, boss 172.583991 s; all stereo, 4410 rendered frames each at 44.1 kHz. Local HTTP navigation and virtual HTTPS navigation blocked by administrator; this is isolated offline decode/render, not integrated fetch/browser or listening QA. All 13 fragments and WAV Git blob hashes match local originals of the release files. No live deployment verification.
