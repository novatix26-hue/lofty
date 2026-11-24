#!/usr/bin/env node

/**
 * ==============================================================================
 * LOFTY LMS - AUTOMATED SUPABASE MIGRATION RUNNER
 * ==============================================================================
 * Connects directly to PostgreSQL / Supabase using DATABASE_URL from .env.local
 * and applies any pending migration files in supabase/migrations/ in order.
 *
 * Usage:
 *   npm run db:migrate             Apply all pending migrations
 *   npm run db:status              Show which migrations have been applied
 *   npm run db:migrate -- --baseline Mark all current files as applied without re-running
 *   node scripts/migrate.mjs <file.sql> Run a single SQL file directly
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load environment variables (.env.local takes precedence, then .env)
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

function cleanConnectionUrl(url) {
  if (!url) return null;
  return url.trim().replace(/^['"]|['"]$/g, '');
}

const databaseUrl = cleanConnectionUrl(rawDbUrl);

// 2. Validate DATABASE_URL
if (!databaseUrl || databaseUrl.includes('placeholder') || databaseUrl.includes('[YOUR-PASSWORD]')) {
  console.error('\n' + '='.repeat(70));
  console.error('❌ DATABASE_URL is not configured in .env.local');
  console.error('='.repeat(70));
  console.error('\nTo enable automated migrations, copy your Postgres connection URI');
  console.error('from Supabase Dashboard and add it to your .env.local file:');
  console.error('\n  Supabase Dashboard -> Project Settings -> Database -> Connection String -> URI');
  console.error('\nAdd this line to your .env.local:\n');
  console.error('  DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"\n');
  console.error('(Be sure to replace [YOUR-PASSWORD] with your actual Supabase database password)');
  console.error('='.repeat(70) + '\n');
  process.exit(1);
}

// 3. Connect to Database with SSL
async function getDbClient() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    console.error('\n❌ Failed to connect to Supabase PostgreSQL database.');
    console.error(`Error: ${err.message}`);
    console.error('\nPlease verify that:');
    console.error('1. Your password in DATABASE_URL is correct.');
    console.error('2. Special characters in the password are percent-encoded (e.g. @ as %40).');
    console.error('3. Your network allows outbound connections to port 5432 or 6543.\n');
    process.exit(1);
  }
}

// 4. Ensure migration tracking schema and table
async function ensureMigrationTable(client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
    );
  `);
}

// 5. Fetch already applied versions
async function getAppliedVersions(client) {
  const res = await client.query(
    'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC;'
  );
  return new Set(res.rows.map((r) => r.version));
}

// 6. Discover migration files
function getMigrationFiles() {
  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((fileName) => {
    const filePath = path.join(migrationsDir, fileName);
    // Version is usually timestamp prefix before first underscore or entire basename
    const match = fileName.match(/^([0-9]+)_(.*)\.sql$/);
    const version = match ? match[1] : path.basename(fileName, '.sql');
    const name = match ? match[2] : fileName;

    return {
      fileName,
      filePath,
      version,
      name,
    };
  });
}

// 7. Main runner logic
async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status') || args.includes('-s');
  const isBaseline = args.includes('--baseline');
  const singleFileArg = args.find((a) => !a.startsWith('--') && a.endsWith('.sql'));

  const client = await getDbClient();

  try {
    await ensureMigrationTable(client);

    // Case A: Run a single arbitrary SQL file
    if (singleFileArg) {
      const targetPath = path.isAbsolute(singleFileArg)
        ? singleFileArg
        : path.join(rootDir, singleFileArg);

      if (!fs.existsSync(targetPath)) {
        console.error(`❌ File not found: ${targetPath}`);
        process.exit(1);
      }

      console.log(`\n🚀 Executing single SQL script: ${path.basename(targetPath)}`);
      const sqlContent = fs.readFileSync(targetPath, 'utf8');

      await client.query('BEGIN');
      await client.query(sqlContent);
      await client.query('COMMIT');

      console.log(`✅ Successfully executed: ${path.basename(targetPath)}\n`);
      return;
    }

    const migrationFiles = getMigrationFiles();
    const appliedVersions = await getAppliedVersions(client);

    // Case B: Status command
    if (isStatus) {
      console.log('\n📊 Migration Status:');
      console.log('='.repeat(70));
      console.log(`${'Version'.padEnd(18)} | ${'Status'.padEnd(12)} | Migration File`);
      console.log('-'.repeat(70));

      for (const m of migrationFiles) {
        const isApplied = appliedVersions.has(m.version);
        const statusStr = isApplied ? '✅ Applied' : '⏳ Pending';
        console.log(`${m.version.padEnd(18)} | ${statusStr.padEnd(12)} | ${m.fileName}`);
      }

      console.log('='.repeat(70) + '\n');
      return;
    }

    // Case C: Baseline command (mark all existing files as applied without re-running)
    if (isBaseline) {
      console.log('\n📌 Baselining current migration files...');
      let markedCount = 0;

      for (const m of migrationFiles) {
        if (!appliedVersions.has(m.version)) {
          await client.query(
            `INSERT INTO supabase_migrations.schema_migrations (version, name)
             VALUES ($1, $2)
             ON CONFLICT (version) DO NOTHING;`,
            [m.version, m.name]
          );
          console.log(`  [BASELINED] ${m.fileName}`);
          markedCount++;
        }
      }

      console.log(`\n✅ Marked ${markedCount} migration(s) as already applied.\n`);
      return;
    }

    // Case D: Apply pending migrations
    const pending = migrationFiles.filter((m) => !appliedVersions.has(m.version));

    if (pending.length === 0) {
      console.log('\n✨ Database is already up to date! (0 pending migrations)\n');
      return;
    }

    console.log(`\n🚀 Applying ${pending.length} pending migration(s) to Supabase:\n`);

    for (const m of pending) {
      const sqlContent = fs.readFileSync(m.filePath, 'utf8');
      console.log(`  ⏳ Running: ${m.fileName}...`);

      const startTime = Date.now();
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query(
          `INSERT INTO supabase_migrations.schema_migrations (version, name)
           VALUES ($1, $2);`,
          [m.version, m.name]
        );
        await client.query('COMMIT');

        const durationMs = Date.now() - startTime;
        console.log(`  ✅ [APPLIED] ${m.fileName} (${durationMs}ms)`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`\n❌ Failed while executing migration: ${m.fileName}`);
        console.error(`Error details: ${migrationErr.message}\n`);
        process.exit(1);
      }
    }

    console.log(`\n🎉 Successfully applied all ${pending.length} migration(s)!\n`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nUnexpected error during migration execution:', err);
  process.exit(1);
});
