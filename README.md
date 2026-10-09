# Token ATM

A personal, responsive token wallet for study and healthy activity habits.

## Publish

Push this directory to a GitHub repository with a `main` branch. In the repository, open Settings → Pages → Build and deployment → Source and choose GitHub Actions. Run the Publish Token ATM workflow or push a new commit. The workflow publishes only index.html; screenshots and documentation are excluded.

## Local development

Run `python3 -m http.server 5180 --directory /workspace/token-atm`.

## Data

Transactions, tasks and rewards are saved automatically in the current browser's localStorage. There is no cloud database, login or cross-device sync. Clearing site data removes the saved state. Export/import is optional backup. Hosting on GitHub Pages does not change this storage model. Do not include private data or credentials in this repository.
