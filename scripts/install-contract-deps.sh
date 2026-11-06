#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../contracts"

forge --version | head -n 1 | grep -q 'Version: 1.9.0$' || {
  echo 'Foundry 1.9.0 is required.' >&2
  exit 1
}
if [ ! -d lib/openzeppelin-contracts ]; then
  forge install --no-git --shallow OpenZeppelin/openzeppelin-contracts@v5.6.1
fi
if [ ! -d lib/forge-std ]; then
  forge install --no-git --shallow foundry-rs/forge-std@v1.17.0
fi
node --input-type=module - <<'JS'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
for (const [name, version] of [['openzeppelin-contracts', '5.6.1'], ['forge-std', '1.17.0']]) {
  const installed = JSON.parse(readFileSync(`lib/${name}/package.json`, 'utf8')).version;
  assert.equal(installed, version, `${name}: wrong version; remove the local copy and reinstall`);
  console.log(`${name} ${installed}`);
}
JS
