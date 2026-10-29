import { useState } from 'react';
import { useLang } from '../i18n';

// 内联 SVG 净值走势图（2026-10-28 基金改版，零第三方依赖）
// navSeries：makeNavSeries 生成的示意序列（起点 1.000，周频，末点=当前）
//
// 2026-10-28 详情页改版（对抗性审查后）：
// 1) 三个区间收益改成「分段控件」本身——上一版同时有「区间收益大数字」和 6M/1Y/成立以来三格，
//    同一个数在一屏里出现两次，且默认 1Y 与大数字完全重复。
// 2) 加日期轴：日期由「末点=当前 + 周频」倒推，不硬编码（写死日期会随时间腐坏）；
//    navMeta 缺 cadence 时退回纯净值轴，宁可不标也不标错。
// 3) 加区间基准虚线：只画折线没有参照，读者无法判断曲线从哪儿起算。
// 4) 2026-10-28 二轮（学富途「业绩走势」）：纵轴改百分比刻度，5 档均分（相对区间首点 = 0%），
//    比 NAV 轴好读。刻度文字**不能画进 svg**——图表用 preserveAspectRatio="none"，
//    svg 内文字会被横向拉伸；且 svg 内留白会随屏宽缩放在 0.97~1.09 之间漂移，与 HTML 对不齐。
//    因此刻度是独立的 HTML 栏，留白在 flex 布局层解决。
const DAY = 86400000;
const RANGES = [
  { key: '6M', n: 26, label: '近6月' },
  { key: '1Y', n: 52, label: '近1年' },
  { key: 'ALL', n: Infinity, label: '成立以来' },
];

// 折线/面积路径生成：points 归一到 [pad, w-pad]×[pad, h-pad] 坐标
export function navScale(points, w, h, pad = 4) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1 || 1);
  return {
    x: (i) => pad + i * step,
    y: (v) => h - pad - ((v - min) / span) * (h - pad * 2),
  };
}

export function navPath(points, w, h, pad = 4) {
  const s = navScale(points, w, h, pad);
  return points.map((v, i) => `${s.x(i).toFixed(1)},${s.y(v).toFixed(1)}`);
}

const W = 300;
const H = 150;
const PAD = 6;
const TICKS = 5;

const fmtYm = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// 区间收益取自详情页同一处口径（fundRangeReturns），这里只负责着色，不重算
const signClass = (v) => (String(v).trim().startsWith('-') ? 'neg' : 'pos');

export default function NavChart({ navSeries, ranges, currency = 'HKD', cadence = 'weekly', lastNavDate = null }) {
  const { t } = useLang();
  const [range, setRange] = useState('1Y');
  const n = RANGES.find(r => r.key === range)?.n ?? 52;
  const pts = navSeries.slice(-n);
  const first = pts[0];
  const last = pts[pts.length - 1];
  const scale = navScale(pts, W, H, PAD);
  const line = navPath(pts, W, H, PAD);

  // 纵轴：相对区间首点的百分比，5 档均分（与 y 线性对应，不需要凑整刻度）
  const pctOf = (v) => (v / first - 1) * 100;
  const yAt = (i) => PAD + (i * (H - PAD * 2)) / (TICKS - 1);
  const tickYs = Array.from({ length: TICKS }, (_, i) => yAt(i));
  const tickVals = tickYs.map(y => {
    // y → 值：y 与值线性反比，用首末点反解，避免再实现一遍归一化
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const v = min + ((H - PAD - y) / (H - PAD * 2)) * span;
    return pctOf(v);
  });

  // 日期轴：末点 = 最后一条净值的实际日期（navMeta.lastNavDate），逐点倒推 7 天。
  // 不能用 Date.now()：后台「追加净值」允许录入今天以前某天的净值，
  // 若图上永远标今天，录入日期与图上日期就对不上（图会替数据说谎）。
  const weekly = cadence === 'weekly';
  const lastMs = lastNavDate ? new Date(`${lastNavDate}T00:00:00`).getTime() : NaN;
  const endMs = Number.isFinite(lastMs) ? lastMs : Date.now();
  const startMs = endMs - (pts.length - 1) * 7 * DAY;
  const midMs = endMs - Math.round((pts.length - 1) / 2) * 7 * DAY;
  const baseY = scale.y(first);

  return (
    <div className="nav-chart">
      <div className="p-fund-detail-ranges" role="group" aria-label={t('净值走势')}>
        {RANGES.map(r => (
          <button
            key={r.key}
            type="button"
            aria-pressed={range === r.key}
            className={`p-fund-detail-range ${range === r.key ? 'is-active' : ''}`}
            onClick={() => setRange(r.key)}
          >
            <span className="p-fund-detail-range-label">{t(r.label)}</span>
            <span className={`p-fund-detail-range-value ${signClass(ranges?.[r.key === '6M' ? 'm6' : r.key === '1Y' ? 'y1' : 'all'])}`}>
              {ranges?.[r.key === '6M' ? 'm6' : r.key === '1Y' ? 'y1' : 'all']}
            </span>
          </button>
        ))}
      </div>

      <div className="p-fund-detail-chartrow">
        <div className="p-fund-detail-yaxis" aria-hidden="true">
          {tickVals.map((v, i) => (
            <span key={i}>{`${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}</span>
          ))}
        </div>
        <svg
          className="nav-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${t('净值走势')} ${t(RANGES.find(r => r.key === range)?.label || '')} ${first?.toFixed(3)} → ${last?.toFixed(3)} ${currency}`}
        >
          <defs>
            <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {tickYs.map((y, i) => (
            <line
              key={i}
              x1={0} x2={W} y1={y} y2={y}
              stroke="var(--border-light)" strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* 区间起点基准线（=0%）：刻度是均分的，通常没有正好落在 0% 的档位，
              所以单独画一条，否则读者找不到「从哪儿起算」。 */}
          <line
            x1={0} x2={W} y1={baseY} y2={baseY}
            stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
          <polygon points={`${PAD},${H - PAD} ${line.join(' ')} ${W - PAD},${H - PAD}`} fill="url(#navFill)" stroke="none" />
          <polyline points={line.join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <circle cx={scale.x(pts.length - 1)} cy={scale.y(last)} r="3" fill="var(--primary)" />
        </svg>
      </div>

      <div className="p-fund-detail-axis" aria-hidden="true">
        {weekly ? (
          <>
            <span>{fmtYm(startMs)}</span>
            <span>{fmtYm(midMs)}</span>
            <span>{fmtYm(endMs)}</span>
          </>
        ) : (
          <>
            <span>{first?.toFixed(3)}</span>
            <span>{last?.toFixed(3)}</span>
          </>
        )}
      </div>

      <p className="p-fund-detail-note">{t('过往业绩不代表将来表现。走势为示意数据，实际以基金定期报告为准。')}</p>
    </div>
  );
}
