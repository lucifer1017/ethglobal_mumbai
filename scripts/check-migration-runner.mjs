import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const name = `meter-runner-${randomBytes(6).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, killSignal: 'SIGKILL' }).trim();
try {
  docker('run', '--detach', '--rm', '--name', name, '--publish', '127.0.0.1::5432',
    '--env', `POSTGRES_PASSWORD=${password}`, 'postgres:16-alpine');
  const port = docker('port', name, '5432/tcp').split(':').at(-1);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { docker('exec', name, 'pg_isready', '-U', 'postgres'); ready = true; break; }
    catch { await setTimeout(500); }
  }
  if (!ready) throw new Error('Throwaway PostgreSQL did not become ready');
  const result = spawnSync('npm', ['test'], {
    cwd: fileURLToPath(new URL('../backend/', import.meta.url)), stdio: 'inherit',
    env: { ...process.env, METER_TEST_DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/postgres` },
  });
  process.exitCode = result.status ?? 1;
} catch {
  console.error('Migration runner check failed; disposable PostgreSQL or test process unavailable.');
  process.exitCode = 1;
} finally {
  try { docker('rm', '--force', name); } catch { /* Startup failed or container already removed. */ }
}
