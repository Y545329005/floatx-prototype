import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const expected = JSON.parse(fs.readFileSync(path.join(project, 'baseline-dist.sha256.json'), 'utf8'));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const current = Object.fromEntries(walk(path.join(project, 'dist')).map(file => [
  path.relative(project, file).split(path.sep).join('/'),
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
]));
const changed = Object.keys(expected).filter(file => current[file] !== expected[file]);
const added = Object.keys(current).filter(file => !Object.hasOwn(expected, file));
if (changed.length || added.length) {
  console.error('Content differs from the delivered baseline. Expected after intentional edits; inspect the diff.');
  console.error(JSON.stringify({ changedOrMissing: changed, added }, null, 2));
  process.exitCode = 1;
} else console.log(`PASS: ${Object.keys(current).length} dist files exactly match the delivered public preview baseline.`);
