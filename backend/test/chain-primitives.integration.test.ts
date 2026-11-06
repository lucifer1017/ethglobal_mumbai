import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { runMigrations } from '../src/db/migrations.js'

const url = process.env.METER_TEST_DATABASE_URL
describe.skipIf(!url)('standalone chain primitives on disposable PostgreSQL 16', () => {
  const schema = 'primitives_' + randomBytes(8).toString('hex')
  const admin = new pg.Pool({ connectionString: url })
  const pool = new pg.Pool({ connectionString: url, options: '-c search_path=' + schema })
  let directory: string
  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA ${schema}`)
    directory = await mkdtemp(join(tmpdir(), 'meter-primitives-'))
    const sql = await readFile(new URL('../src/db/schema/chain-primitives.sql', import.meta.url), 'utf8')
    await writeFile(join(directory, '0001_test_primitives.sql'), sql)
  })
  afterAll(async () => {
    await pool.end()
    await admin.query(`DROP SCHEMA ${schema} CASCADE`)
    await admin.end()
    if (directory) await rm(directory, { recursive: true, force: true })
  })

  test('component applies once in its own schema without application tables', async () => {
    expect(await runMigrations(pool, directory)).toEqual(['0001_test_primitives.sql'])
    expect(await runMigrations(pool, directory)).toEqual([])
    const tables = await pool.query('SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename', [schema])
    expect(tables.rows.map(row => row.tablename)).toEqual(['chain_cursors', 'schema_migrations', 'tokens'])
  })

  test('uint256 values stay exact and reject fractional, negative and overflowing values', async () => {
    const maximum = (2n ** 256n - 1n).toString()
    for (const value of ['0', '1000001', maximum]) {
      expect((await pool.query('SELECT $1::meter_uint256::text AS value', [value])).rows[0].value).toBe(value)
    }
    for (const value of ['1.5', '-1', (2n ** 256n).toString(), 'NaN', 'Infinity']) {
      await expect(pool.query('SELECT $1::meter_uint256', [value])).rejects.toMatchObject({ code: '23514' })
    }
  })

  test('tokens use chain/address identity and enforce chain, address and decimal domains', async () => {
    const address = '0x' + 'a'.repeat(40)
    const insert = (chain: number, token = address, decimals = 6) => pool.query(
      'INSERT INTO tokens (chain_id,address,symbol,decimals) VALUES ($1,$2,$3,$4)', [chain, token, 'TEST', decimals])
    await insert(1874)
    await insert(11155111)
    await expect(insert(1874)).rejects.toMatchObject({ code: '23505' })
    await expect(insert(2625)).rejects.toMatchObject({ code: '23514' })
    await expect(insert(1874, '0x' + 'A'.repeat(40))).rejects.toMatchObject({ code: '23514' })
    for (const decimals of [-1, 256]) {
      await expect(insert(1874, '0x' + 'b'.repeat(40), decimals)).rejects.toMatchObject({ code: '23514' })
    }
    await expect(pool.query('SELECT $1::meter_hash', ['0x' + 'f'.repeat(64)])).resolves.toBeDefined()
    await expect(pool.query('SELECT $1::meter_hash', ['0x' + 'f'.repeat(63)])).rejects.toMatchObject({ code: '23514' })
  })

  test('cursors are chain-scoped and cannot move the safe block beyond processed', async () => {
    const insert = (chain: number, processed: number, safe: number) => pool.query(
      'INSERT INTO chain_cursors VALUES ($1,$2,$3)', [chain, processed, safe])
    await insert(1874, 100, 95)
    await insert(11155111, 100, 97)
    await expect(insert(1874, 101, 96)).rejects.toMatchObject({ code: '23505' })
    await pool.query('DELETE FROM chain_cursors WHERE chain_id=1874')
    for (const [processed, safe] of [[-1, 0], [1, -1], [1, 2]]) {
      await expect(insert(1874, processed!, safe!)).rejects.toMatchObject({ code: '23514' })
    }
    await expect(insert(2625, 1, 0)).rejects.toMatchObject({ code: '23514' })
  })
})
