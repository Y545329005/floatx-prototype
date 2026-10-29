import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(project, 'dist');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(dist);
const htmlFiles = files.filter(p => p.endsWith('.html'));
const errors = [];
const html = new Map(htmlFiles.map(p => [p, fs.readFileSync(p, 'utf8')]));
const ids = new Map();
for (const [file, text] of html) {
  const list = [...text.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ids.set(file, new Set(list));
  if (new Set(list).size !== list.length) errors.push(`${path.relative(project, file)}: duplicate id`);
  if (!/<html\b[^>]*\blang="(?:zh-Hant|en)"/.test(text)) errors.push(`${file}: missing page language`);
  if (!/<meta\b[^>]*name="viewport"/.test(text)) errors.push(`${file}: missing viewport`);
}
let localReferences = 0;
const checkRef = (file, raw) => {
  const ref = raw.trim().replaceAll('&amp;', '&');
  if (!ref || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) return;
  localReferences++;
  const hash = ref.indexOf('#');
  const fragment = hash >= 0 ? ref.slice(hash + 1) : '';
  const route = (hash >= 0 ? ref.slice(0, hash) : ref).split('?')[0];
  let target;
  try { target = route ? path.resolve(path.dirname(file), decodeURIComponent(route)) : file; }
  catch { errors.push(`${file}: invalid URL ${raw}`); return; }
  if (route.startsWith('/')) { errors.push(`${file}: root-relative URL breaks subdirectory deployment: ${raw}`); return; }
  if (target !== dist && !target.startsWith(dist + path.sep)) { errors.push(`${file}: URL leaves dist: ${raw}`); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target) && !path.extname(target)) target += '.html';
  if (!fs.existsSync(target)) { errors.push(`${file}: missing target ${raw}`); return; }
  if (fragment && ids.has(target)) {
    let decoded;
    try { decoded = decodeURIComponent(fragment); } catch { decoded = fragment; }
    if (!ids.get(target).has(decoded)) errors.push(`${file}: missing anchor ${raw}`);
  }
};
for (const [file, text] of html) {
  for (const match of text.matchAll(/\b(?:href|src)="([^"]*)"/g)) checkRef(file, match[1]);
  for (const match of text.matchAll(/\baria-(?:controls|labelledby|describedby)="([^"]+)"/g)) {
    for (const id of match[1].split(/\s+/)) if (!ids.get(file).has(id)) errors.push(`${file}: missing ARIA target ${id}`);
  }
}
for (const file of files.filter(p => p.endsWith('.css'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) checkRef(file, match[1]);
}
const jsFiles = [path.join(project, 'build.mjs'), ...walk(path.join(project, 'src')), ...files, ...walk(path.join(project, 'scripts'))]
  .filter(p => /\.(?:mjs|js)$/.test(p));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`${file}: syntax check failed\n${result.stderr || result.error}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${htmlFiles.length} HTML pages, ${localReferences} local references, ${jsFiles.length} JavaScript files; IDs, anchors and ARIA references valid.`);
