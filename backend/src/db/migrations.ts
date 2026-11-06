import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import type { Pool } from 'pg'
import { join } from 'node:path'

/** One transaction and a database lock serialize migrations across processes. */
export async function runMigrations(pool: Pool, directory: string): Promise<string[]> {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
  if (!files.length || files.some((name) => !/^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    || new Set(files.map((name) => name.slice(0, 4))).size !== files.length) {
    throw new Error('Invalid or duplicate migration filenames')
  }
  const migrations = await Promise.all(files.map(async (name) => {
    const sql = await readFile(join(directory, name), 'utf8')
    return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') }
  }))
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(1874, 11155111)')
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
    const applied = await client.query<{ name: string; checksum: string }>('SELECT name, checksum FROM schema_migrations ORDER BY name')
    // Applied history must be a matching prefix; never silently edit or remove history.
    if (applied.rows.some((row, index) => row.name !== migrations[index]?.name || row.checksum !== migrations[index]?.checksum)) {
      throw new Error('Applied migration history differs from files')
    }
    const pending = migrations.slice(applied.rows.length)
    for (const migration of pending) {
      await client.query(migration.sql)
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)', [migration.name, migration.checksum])
    }
    await client.query('COMMIT')
    return pending.map((migration) => migration.name)
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}
