import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const connectionString = process.env.TIMESCALE_SERVICE_URL;
if (!connectionString) {
  console.error('Tiger Cloud setup skipped: set TIMESCALE_SERVICE_URL in the server environment first.');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1,
  connect_timeout: 10,
  idle_timeout: 2,
  prepare: false,
  onnotice: false,
  connection: { application_name: 'bitzy-tiger-schema-setup' },
});

try {
  const migration = readFileSync(new URL('../db/tiger/001_bitzy_game_answer_events.sql', import.meta.url), 'utf8');
  await sql.unsafe(migration);
  const [table] = await sql`
    select exists (
      select 1 from timescaledb_information.hypertables
      where hypertable_schema = 'public' and hypertable_name = 'bitzy_game_answer_events'
    ) as ready
  `;
  if (!table?.ready) throw new Error('Hypertable verification failed.');
  console.log('Tiger Cloud analytics table and time-series hypertable are ready.');
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
  console.error(`Tiger Cloud schema setup failed (error code ${code}; details withheld).`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 2 });
}
