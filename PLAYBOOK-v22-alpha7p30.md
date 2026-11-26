# Playbook — Region & Boss Identity

Production: https://stophumans.pages.dev/
GitHub: https://github.com/Whoisnicko/StopHumans

1. Ctrl+F5. Home screen version should read v22-alpha.7.30.
2. Guardian's Academy > Free Sandbox > hero > relic. Click Fight The Grand Huntsman. Expect a winding earthen path, wooded borders and labeled Cover/Brambles, plus Huntsman name and crossbow sprite.
3. Click Fight The Crusader during battle. Expect original illustrated Valley, knight sprite, Crusader name, sweep ability.
4. Click Fight Commander · Classic. Expect original Valley wave 10, Commander name and original commander sprite, no Consecrated Sweep. Switch back to Huntsman; forest returns. Check normal campaign and Codex. No campaign unlocks or saves modified.
5. Build version single source: meta[name=game-version] in index.html; both [data-build-version] elements populated at startup. Update that value for future releases. Script cache query strings still require release maintenance.
