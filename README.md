# Token ATM

A personal, responsive token wallet for study and healthy activity habits.

## Publish

Push this directory to a GitHub repository with a `main` branch. In the repository, open Settings → Pages → Build and deployment → Source and choose GitHub Actions. Run the Publish Token ATM workflow or push a new commit. The workflow publishes index.html, cloud-config.js, courses.js, courses.css, meal-planner.js, meal-planner.css, budget.js and budget.css; screenshots and documentation are excluded.

## Local development

Run `python3 -m http.server 5180 --directory /workspace/token-atm`.

## Data

Transactions, tasks and rewards are saved automatically in the current browser's localStorage. Optional Supabase cloud sync is configured in cloud-config.js using only the public Project URL and publishable key. Run supabase-schema.sql in the project SQL Editor and set Authentication → URL Configuration → Site URL to the public website URL. Register an email/password account, confirm the email if required, and sign in with that account on each device. Row-level security restricts cloud records to the signed-in user. Changes first save locally and then sync; the UI distinguishes pending, failed and successful synchronization. Concurrent device changes are protected using a revision check; resolve conflicts explicitly with Get cloud records. Clearing browser data removes local-only or unsynchronized records. Export/import is optional backup. Hosting on GitHub Pages does not change this storage model. Do not include private data or credentials in this repository.

## Course revision

The Course Revision tab shows Canvas-style course cards. Open a course to batch-add multiple named exams with optional dates, independent checklists and revision progress. The calendar shows all exams, including multiple exams on the same day. Existing single-exam courses are displayed through a backward-compatible adapter; their exam dates and checklist completion are preserved when edits upgrade the course to the multiple-exam format. Courses use the existing private Supabase JSON state, so no database migration is required. Exam reminders appear inside the website; push notifications are not implemented. The former Habit Progress tab was removed at the user’s request.

## Weekly menus and meal rewards

Under Weight Management → Weekly Menu, choose a whole-day menu and adjust serving quantities. Protein allows multiple distinct foods; other categories allow one food each. Common food values are estimates; custom foods can use package-label calories. Schedule one whole-day menu across selected weekdays in the selected week. Repeat the selected week for 2–52 total weeks (including the source week); a confirmation lists future weeks that would be replaced. Copies keep weekdays, quantities and reward settings, have independent plan IDs, and never copy completions or reward transactions. Existing meal-based plans remain readable as a whole-day menu; edits replace only the selected weekdays, while recorded snapshots stay intact. The planner checks the whole-day total against the user-selected 1200 kcal daily cap, including fractional servings. This is the user's configured menu limit, not a general recommended intake.

The former regular-eating task is replaced by the meal-plan reward. Only today's whole-day menu can be confirmed; confirmation creates matching actual intake records (and preserves legacy meal types when applicable). The menu must match the day's recorded food, with no extra food records, to claim the default 20-token reward. One daily ledger key prevents repeat rewards, including rewards previously claimed through the old t5 task. The website relies on self-report and cannot verify actual food consumption. The first confirmation freezes the day's plan snapshot, so later weekly-plan edits cannot change completion eligibility or repeat a reward. Earlier snapshots and historical ledger entries remain intact.

## Budget

Record USD expenses with a date and category. The frontend requests the latest available USD/CNY reference rate from https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY. The ECB-backed rate is usually updated on working days and is labeled with its source date; it is not a real-time bank quote. Each expense retains its entry-time rate, so updates do not revalue historical expenses. Weekly/monthly charts show CNY totals, with USD budgets and remaining/over-budget amounts. If live FX is unavailable, a dated saved quote can be used; without a quote the app disables expense saving rather than guessing. Menu, food, reward, expense and budget data share the existing private account-state sync and require no database schema migration.
