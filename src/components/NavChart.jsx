import { useState } from 'react';
import { useLang } from '../i18n';

// 内联 SVG 净值走势图（2026-10-28 基金改版，零第三方依赖）
// navSeries：makeNavSeries 生成的示意序列（起点 1.000）；区间切换按点数切片
// 复用方：折线路径生成器导出给列表页 sparkline 复用（navPath）
const RANGES = [
  { key: '6M', n: 26 },
  { key: '1Y', n: 52 },
  { key: 'ALL', n: Infinity },
];

// 折线/面积路径生成：points 归一到 [pad, w-pad]×[pad, h-pad] 坐标
export function navPath(points, w, h, pad = 4) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1 || 1);
  return points.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

const W = 328;
const H = 132;
const PAD = 6;

export default function NavChart({ navSeries }) {
  const { t } = useLang();
  const [range, setRange] = useState('1Y');
  const n = RANGES.find(r => r.key === range)?.n ?? 52;
  const pts = navSeries.slice(-n);
  const line = navPath(pts, W, H, PAD);
  const ret = ((pts[pts.length - 1] / pts[0] - 1) * 100).toFixed(1);
  const retText = `${ret >= 0 ? '+' : ''}${ret}%`;
  const positive = ret >= 0;

  return (
    <div className="nav-chart">
      <div className="nav-chart-head">
        <span className={`nav-chart-ret ${positive ? 'pos' : 'neg'}`}>{retText}</span>
        <span className="text-muted text-sm">{t('区间收益')}</span>
      </div>
      <svg className="nav-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={`${PAD},${H - PAD} ${line.join(' ')} ${W - PAD},${H - PAD}`} fill="url(#navFill)" stroke="none" />
        <polyline points={line.join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="nav-chart-foot">
        <span className="text-muted text-sm">{pts[0].toFixed(3)}</span>
        <div className="nav-pills">
          {RANGES.map(r => (
            <button key={r.key} className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>
              {r.key === 'ALL' ? t('成立以来') : r.key}
            </button>
          ))}
        </div>
        <span className="nav-chart-end">{pts[pts.length - 1].toFixed(3)}</span>
      </div>
      <p className="text-muted text-sm nav-chart-note">{t('走势为示意数据，实际以基金定期报告为准')}</p>
    </div>
  );
}
