# Stop Humans! v21-alpha.2.2 — Merge confirmation hotfix

Root cause: previous sandbox guard excluded Do not ask again from persisting. Shared browser UI preference gs.askMerge now updates on checkbox change, with close-handler fallback, in both campaign and sandbox. The next stack or merge skips confirmation; existing Undo and fusion logic unchanged. Settings includes Confirm stacking and merging to restore prompts. Preference intentionally shared, campaign progress remains isolated. Syntax and isolated tests for immediate save, merge, cancel and re-enable passed. Browser reload and Cloudflare deployment pending verification. No grimoire or art changes.

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans
