import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { assetHistory, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

const RANGES = [
  { key: '3m', label: '近3月', slice: d => d.slice(-3) },
  { key: '6m', label: '近6月', slice: d => d.slice(-6) },
  { key: 'ytd', label: '今年', slice: d => d.filter(a => a.date.startsWith('2026')) },
  { key: 'all', label: '全部', slice: d => d },
];

const CHART_W = 320;
const CHART_H = 120;
const CHART_PAD = 8;

export default function AssetTrend({ navigate, goBack }) {
  const { t } = useLang();
  const [range, setRange] = useState('6m');

  const data = RANGES.find(r => r.key === range).slice(assetHistory);
  const rangeFirst = data[0].total;
  const rangeLast = data[data.length - 1].total;
  const rangeChange = rangeLast - rangeFirst;
  const rangePct = (rangeChange / rangeFirst * 100).toFixed(1);
  const rangeUp = rangeChange >= 0;

  const maxVal = Math.max(...data.map(a => a.total));
  const minVal = Math.min(...data.map(a => a.total));
  const span = maxVal - minVal || 1;
  const pts = data.map((a, i) => {
    const x = data.length === 1 ? CHART_W / 2 : (CHART_W - CHART_PAD * 2) * (i / (data.length - 1)) + CHART_PAD;
    const y = CHART_H - CHART_PAD - ((a.total - minVal) / span) * (CHART_H - CHART_PAD * 2);
    return { ...a, x, y };
  });
  const ptsStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPts = `${pts[0].x.toFixed(1)},${CHART_H} ${ptsStr} ${pts[pts.length - 1].x.toFixed(1)},${CHART_H}`;

  return (
    <div className="page asset-trend-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#assets')}><ArrowLeft size={20} /></button>
          <h1>{t('资产走势')}</h1>
        </div>
      </div>

      <div className="card">
        <div className="range-card-head">
          <h3 className="card-title">{t('资产趋势')}</h3>
          <div className="range-tabs">
            {RANGES.map(r => (
              <button key={r.key} className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>
                {t(r.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="range-summary">
          <span>{t('区间末值')} HK$ {formatCurrency(rangeLast)}</span>
          <span className={rangeUp ? 'up' : 'down'}>
            {rangeUp ? '+' : '-'}{formatCurrency(Math.abs(rangeChange))}（{rangePct}%）
          </span>
        </div>
        <div className="asset-chart">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="assetChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A1F44" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0A1F44" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points={areaPts} fill="url(#assetChartFill)" />
            <polyline points={ptsStr} fill="none" stroke="#0A1F44" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle className="asset-chart-dot" cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" strokeWidth="1.5" />
          </svg>
          <div className="chart-labels">
            {data.map((a, i) => (
              <span key={i}>{+a.date.slice(5, 7)}{t('月')}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
