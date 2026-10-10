# Tiger Cloud performance analytics

Bitzy continues to use **Supabase as the source of truth** for authentication, courses, rewards, and game answers. Tiger Cloud is an additive time-series copy used to calculate the Profile's dated game-performance trend.

## Data copied

The server verifies the signed-in Supabase user and loads that user's already-saved answer rows from `user_question_progress`. Only these fields are copied to Tiger Cloud:

- user UUID
- opaque question/event identifier
- game identifier
- correct/incorrect result
- answer timestamp

Submitted answers, code, prompt text, XP, credentials, and other profile/course data are **not** copied. The mirror includes only the selected authenticated user's game rows in the current trend window and is safe to retry (duplicate rows are ignored).

## Configure the server

Set `TIMESCALE_SERVICE_URL` from the supplied Tiger Cloud connection string in the **server-only** environment for local development and the deployed API. Do not put the value in source code, a `VITE_` variable, browser storage, a client-side config, or a distributable ZIP.

For local development, add the variable to a private, git-ignored `.env` file at the project root. On deployment, set it in the host's server/runtime secrets configuration. TLS is required by the server connection.

## Create the additive time-series table

With `TIMESCALE_SERVICE_URL` available to the local shell or private `.env`, run once:

```bash
npm run tiger:setup
```

This applies `db/tiger/001_bitzy_game_answer_events.sql`: an additive Timescale hypertable plus user/time and user/game/time indexes. It does not drop, alter, or migrate Supabase tables.

## Runtime behavior

When Profile analytics requests a trend, the protected API uses the Supabase-authenticated user ID, syncs that user's recent saved answers idempotently, then returns daily answer counts from Tiger Cloud. The browser never receives the database credential or issues SQL. If Tiger Cloud is unavailable or not configured, the chart clearly falls back to the same authenticated Supabase answer history.

Older session totals and best/latest scores in `game_progress` do not provide a dated answer sequence. They remain useful for totals and score cards, but cannot be converted into historical daily accuracy without inventing events. The Tiger trend therefore uses dated answer records only.

## References

- [Tiger Data: `create_hypertable()`](https://www.tigerdata.com/docs/reference/timescaledb/hypertables/create_hypertable) — time column and unique/primary-key constraints must include the hypertable partitioning column.
- [postgres.js connection and query docs](https://github.com/porsager/postgres#connection) — TLS options and parameterized tagged-template queries.
