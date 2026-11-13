#!/usr/bin/env node
// check:copy —— 对内文案扫描（交付门，2026-11-13 阶段 2）
// 规则与口径：prototype/docs/基金APP交付规范-2026-11-13.html 附录 B
//
// 1) 扫 src/pages/**/*.jsx 中 t('…') 字面量，命中禁用词即 FAIL
// 2) 允许清单：ALLOW_RANGES（file + 行范围 + 理由），挪行即失效，强制人工复核
// 3) 行内豁免：词条行上方 8 行内最近一条含 `copy-allow:` 的行（含本行）
// 4) 文件级跳过：SKIP_FILES（已移出投资人路由的内部演示页）
// 5) i18n 三语齐备：每个 key 必须在 en.js 与 zhHK.js 有词条（zh-CN 以 key 直显）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src/pages', 'src/components'];
const BANNED = /演示|模拟|占位|校样|原型|后端|mock|推算/i;
const T_LIT = /\bt\(\s*(['"])((?:(?!\1).)+?)\1/g;

// 文件级跳过：整页内部演示内容，不面向投资人（文件保留，不进路由）
const SKIP_FILES = {
  'src/pages/CryptoMap.jsx': '内部演示页（钱包组状态对照），2026-11-13 移出投资人路由，文件保留',
};

// 允许清单：file + 行范围 + 理由。挪行导致范围错位时必须人工复核后更新。
const ALLOW_RANGES = [
  {
    file: 'src/pages/Settings.jsx',
    from: 186,
    to: 230,
    reason: '演示维护卡：判据2 演示操作口，整体收进演示模式开关（阶段 1 落地）',
  },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.jsx') ? [p] : [];
  });
}

function rel(f) {
  return path.relative(ROOT, f).split(path.sep).join('/');
}

const fails = [];
const allKeys = []; // { key, file, line } 供 i18n 三语校验

for (const dir of SCAN_DIRS) {
  for (const f of walk(path.join(ROOT, dir))) {
    const r = rel(f);
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const allowLines = lines
      .map((ln, i) => (ln.includes('copy-allow:') ? i + 1 : -1))
      .filter((i) => i > 0);

    lines.forEach((ln, i) => {
      const line = i + 1;
      let m;
      T_LIT.lastIndex = 0;
      while ((m = T_LIT.exec(ln))) {
        const key = m[2];
        allKeys.push({ key, file: r, line });
        if (!BANNED.test(key)) continue;
        if (SKIP_FILES[r]) continue;
        const range = ALLOW_RANGES.find((g) => g.file === r && line >= g.from && line <= g.to);
        if (range) continue;
        const near = allowLines.some((a) => a <= line && line - a <= 8);
        if (near) continue;
        fails.push(`${r}:${line}  t('${key}')`);
      }
    });
  }
}

// ---- i18n 三语齐备（附录 B 第 5 行）----
const enSrc = fs.readFileSync(path.join(ROOT, 'src', 'i18n', 'en.js'), 'utf8');
const hkSrc = fs.readFileSync(path.join(ROOT, 'src', 'i18n', 'zhHK.js'), 'utf8');
function hasEntry(src, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*'${esc}'\\s*:`, 'm').test(src);
}
for (const { key, file, line } of allKeys) {
  if (!hasEntry(enSrc, key)) fails.push(`${file}:${line}  缺 EN 词条: ${key}`);
  if (!hasEntry(hkSrc, key)) fails.push(`${file}:${line}  缺 zh-HK 词条: ${key}`);
}

if (fails.length) {
  console.error(`check:copy FAIL（${fails.length} 处）`);
  console.error(fails.map((s) => `  ${s}`).join('\n'));
  console.error('口径见 prototype/docs/基金APP交付规范-2026-11-13.html 附录 B');
  process.exit(1);
}
console.log(`check:copy OK（${allKeys.length} 个词条，禁用词 0 命中，三语齐备）`);
