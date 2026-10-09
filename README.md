# Token ATM

A personal, responsive token wallet for study and healthy activity habits.

## Publish

Push this directory to a GitHub repository with a `main` branch. In the repository, open Settings → Pages → Build and deployment → Source and choose GitHub Actions. Run the Publish Token ATM workflow or push a new commit. The workflow publishes index.html and cloud-config.js; screenshots and documentation are excluded.

## Local development

Run `python3 -m http.server 5180 --directory /workspace/token-atm`.

## Data

Transactions, tasks and rewards are saved automatically in the current browser's localStorage. Optional Supabase cloud sync is configured in cloud-config.js using only the public Project URL and publishable key. Run supabase-schema.sql in the project SQL Editor and set Authentication → URL Configuration → Site URL to the public website URL. Register an email/password account, confirm the email if required, and sign in with that account on each device. Row-level security restricts cloud records to the signed-in user. Changes first save locally and then sync; the UI distinguishes pending, failed and successful synchronization. Concurrent device changes are protected using a revision check; resolve conflicts explicitly with Get cloud records. Clearing browser data removes local-only or unsynchronized records. Export/import is optional backup. Hosting on GitHub Pages does not change this storage model. Do not include private data or credentials in this repository.
