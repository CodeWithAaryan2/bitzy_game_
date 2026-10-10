# Bitzy Coding RPG setup

## Enable the feature

1. Apply [`db/migrations/005_coding_rpg.sql`](db/migrations/005_coding_rpg.sql) to the project's Supabase database **before** opening the new pages. It creates private attempt/mastery/reward tables, idempotency constraints, server-only reward functions, and the `Logic Warden` achievement record.
2. Keep the existing authenticated Supabase session available to the tRPC client. The API verifies the bearer token and derives the user ID from that verified session; it does not accept a user ID from the browser.
3. Ensure the existing API runtime has the configured Supabase URL and service-role key. The service-role key must remain server-only and must never be added to a `VITE_*` variable or shipped to the app.
4. Rebuild/redeploy both the Vite client and API after applying the migration. The skill-tree lesson links use the current `/app/courses/:courseSlug/:moduleSlug/:lessonSlug` route.

## Security and assessment behavior

- Bug Detective uses bounded local pattern checks for common JavaScript/TypeScript mistakes. It does **not** run, evaluate, or send submitted code to a server.
- Assessment answer keys stay in the API. Submissions are size-validated, compared against fixed reviewed answers, tied to the verified user ID, and recorded through the server-only database function.
- Attempts and verified mastery are private to their owner through the API and database grants/RLS. Per-request UUIDs make retries idempotent; verified mastery increments once per distinct assessment.
- Boss stages unlock sequentially. The first stage requires one verified Bug Detective result. The final reward is fixed at 250 XP and 100 coins, granted once in the database transaction; level calculation follows the existing Bitzy XP curve. The same transaction records the Logic Warden achievement and syncs the existing XP activity/leaderboard records.
- The front end cannot award XP/coins or write to the new RPG tables directly.

## Routes

- `/app/bug-detective`
- `/app/skill-tree`
- `/app/boss-battle`
- `/app/developer-dna`

The Skill Tree uses existing course/lesson data and course progress. Developer DNA marks unsupported or unassessed skills as unassessed rather than assigning inferred scores.
