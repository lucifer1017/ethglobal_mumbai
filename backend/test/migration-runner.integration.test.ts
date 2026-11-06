import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { runMigrations } from '../src/db/migrations.js'

// Only the launcher or CI supplies this disposable database, never DATABASE_URL.
const url = process.env.METER_TEST_DATABASE_URL
describe.skipIf(!url)('isolated numbered migration runner on PostgreSQL 16', () => {
  const pool = new pg.Pool({ connectionString: url })
  let directory: string
  const first = 'CREATE TABLE runner_marker (id INT PRIMARY KEY); INSERT INTO runner_marker VALUES (1);'
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'meter-runner-'))
    await writeFile(join(directory, '0001_marker.sql'), first)
    await writeFile(join(directory, '0002_second.sql'), 'INSERT INTO runner_marker VALUES (2);')
  })
  afterAll(async () => { await pool.end(); await rm(directory, { recursive: true, force: true }) })

  test('concurrent runners apply once and subsequent runs are no-ops', async () => {
    const results = await Promise.all([runMigrations(pool, directory), runMigrations(pool, directory)])
    expect(results.flat().sort()).toEqual(['0001_marker.sql', '0002_second.sql'])
    expect(await runMigrations(pool, directory)).toEqual([])
    expect((await pool.query('SELECT id FROM runner_marker ORDER BY id')).rows).toEqual([{ id: 1 }, { id: 2 }])
  })

  test('failed SQL rolls back both DDL and migration history', async () => {
    await writeFile(join(directory, '0003_failure.sql'), 'CREATE TABLE runner_rollback (id INT); SELECT * FROM runner_absent;')
    await expect(runMigrations(pool, directory)).rejects.toMatchObject({ code: '42P01' })
    expect((await pool.query("SELECT to_regclass('runner_rollback') AS name")).rows[0].name).toBeNull()
    expect((await pool.query('SELECT count(*) FROM schema_migrations')).rows[0].count).toBe('2')
    await rm(join(directory, '0003_failure.sql'))
  })

  test('checksum edits and removed applied files are rejected', async () => {
    await writeFile(join(directory, '0001_marker.sql'), '-- changed applied migration')
    await expect(runMigrations(pool, directory)).rejects.toThrow('Applied migration history differs')
    await writeFile(join(directory, '0001_marker.sql'), first)
    await rm(join(directory, '0002_second.sql'))
    await expect(runMigrations(pool, directory)).rejects.toThrow('Applied migration history differs')
  })

  test('invalid and duplicate sequence filenames are rejected', async () => {
    await writeFile(join(directory, 'unversioned.sql'), 'SELECT 1;')
    await expect(runMigrations(pool, directory)).rejects.toThrow('Invalid or duplicate migration filenames')
    await rm(join(directory, 'unversioned.sql'))
    await writeFile(join(directory, '0001_duplicate.sql'), 'SELECT 1;')
    await expect(runMigrations(pool, directory)).rejects.toThrow('Invalid or duplicate migration filenames')
  })
})
