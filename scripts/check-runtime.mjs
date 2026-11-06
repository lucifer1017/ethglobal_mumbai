import assert from 'node:assert/strict';

assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Meter requires Node 24; select the version in .nvmrc');
console.log(`Node ${process.versions.node}: runtime check passed`);
