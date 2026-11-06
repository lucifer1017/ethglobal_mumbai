// Compile a temporary probe rather than adding application contracts prematurely.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('bash', [join(root, 'scripts/install-contract-deps.sh')], { stdio: 'inherit' });
const temporary = mkdtempSync(join(tmpdir(), 'meter-toolchain-'));
try {
  cpSync(join(root, 'contracts/foundry.toml'), join(temporary, 'foundry.toml'));
  cpSync(join(root, 'contracts/remappings.txt'), join(temporary, 'remappings.txt'));
  symlinkSync(join(root, 'contracts/lib'), join(temporary, 'lib'), 'dir');
  mkdirSync(join(temporary, 'src'));
  mkdirSync(join(temporary, 'test'));
  writeFileSync(join(temporary, 'src/Probe.sol'), `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
contract Probe is Ownable { constructor() Ownable(msg.sender) {} }
`);
  writeFileSync(join(temporary, 'test/Probe.t.sol'), `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {Probe} from "../src/Probe.sol";
contract ProbeTest is Test {
    function test_constructorRecordsOwner() public { assertEq(new Probe().owner(), address(this)); }
}
`);
  execFileSync('forge', ['test', '--root', temporary, '-vv'], { stdio: 'inherit' });
  const artifact = JSON.parse(readFileSync(join(temporary, 'out/Probe.sol/Probe.json'), 'utf8'));
  const metadata = typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata;
  assert.match(metadata.compiler.version, /^0\.8\.30\+/);
  assert.equal(metadata.settings.evmVersion, 'prague');
  console.log('PASS: OpenZeppelin/forge-std probe; solc 0.8.30; compiled metadata uses Prague.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
