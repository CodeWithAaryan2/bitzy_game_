import postgres from "postgres";

async function dropAll() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("No DATABASE_URL"); return; }

  const client = postgres(dbUrl, { max: 1, prepare: false });

  console.log("Dropping all tables...");

  // Drop enums first, then tables
  const schemaName = "public";

  // Get all tables
  const tables = await client`
    SELECT tablename FROM pg_tables
    WHERE schemaname = ${schemaName}
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
  `;

  console.log(`Found ${tables.length} tables`);

  // Drop tables with CASCADE
  for (const row of tables) {
    const tableName = row.tablename;
    console.log(`Dropping ${tableName}...`);
    await client.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
  }

  // Drop all custom enums
  const enums = await client`
    SELECT typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = ${schemaName}
    AND t.typtype = 'e'
  `;

  for (const row of enums) {
    console.log(`Dropping enum ${row.typname}...`);
    await client.unsafe(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
  }

  console.log("All tables and enums dropped!");
  await client.end();
}

dropAll().catch(console.error);
