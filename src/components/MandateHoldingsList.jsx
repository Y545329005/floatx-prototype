import { useLang } from '../i18n';
import { formatExactAmount, formatShares } from '../mock/data';

// 委托持仓列表（2026-11-16）：与资产页「基金持仓」同构的两行行式——
// 左 = 名称 / 代码 · 股数 @ 单价，右 = 折合港币市值 / 收益（含百分比）。
// 估值口径逐行写（2026-11-17 改）：口径是"这一行"的属性，客户按行看；
// 「统一就收进脚注」看似省字，实际让人以为没标（列表里看不到"收盘价/成本价"）。
// 估值日仍只统一时进脚注；不统一时随口径回到行内。
// 金额不带币种符号：列头与脚注已声明港币口径，行内只留裸数字，避免长数值折行。
// 行本身不可点（委托持仓没有详情页），复用 .asset-hold-* 保证与基金持仓同一套字号与间距。

const VALUATION_SHORT = {
  listed: '收盘价',
  'unlisted-cost': '成本价',
  cis: '公布价',
  accrued: '费用按已收',
};

export default function MandateHoldingsList({ positions, limit }) {
  const { t, lang } = useLang();
  const rows = limit ? positions.slice(0, limit) : positions;

  // 日期统一时收进脚注（同一组合的日行情通常同日），不统一时随口径回到行内
  const dates = positions.map(p => p.priceAt).filter(Boolean);
  const uniformDate = dates.length === positions.length && dates.every(d => d === dates[0]) ? dates[0] : '';

  const methodText = (method) => t(VALUATION_SHORT[method] || method);
  const note = [
    uniformDate ? `${t('估值日')} ${uniformDate}` : '',
    t('金额按估值日汇率折合港币'),
  ].filter(Boolean).join(' · ');

  return (
    <>
      <div className="asset-hold-colhead">
        <span>{t('名称 / 数量')}</span>
        <span>{t('金额 / 收益（HKD）')}</span>
      </div>

      {rows.map(pos => {
        // 浮动收益为零（非上市按成本估值恒为此情形）时不着色、不带正号：
        // 「+0.00」既无信息又占一格绿色，会让人以为有变动。
        const delta = pos.unrealizedHKD;
        const flat = Math.abs(delta) < 0.005;
        const tone = flat ? '' : delta > 0 ? 'up' : 'down';
        return (
          <div key={pos.symbol} className="asset-hold-row is-flat">
            <span className="asset-hold-left">
              <span className="asset-hold-name">{pos.name || pos.symbol}</span>
              <span className="asset-hold-shares mandate-holdings-meta">
                {pos.symbol} · {formatShares(pos.quantity)} {t('股')}
                {pos.valued ? ` @ ${pos.price} ${pos.currency}` : ''}
                {/* 口径跟在报价后面：窄屏只在空格处折行（word-break: keep-all）；
                    「·」与口径之间用不换行空格，断点落在「·」之前，不会出现行尾孤零零一个「·」 */}
                {pos.valued ? ` ·\u00A0${methodText(pos.valuationMethod)}` : ` ·\u00A0${t('待估值')}`}
                {!uniformDate && pos.priceAt ? ` ·\u00A0${pos.priceAt}` : ''}
              </span>
            </span>
            <span className="asset-hold-right">
              <strong className="asset-hold-amount">{formatExactAmount(pos.marketValueHKD)}</strong>
              <span className={`asset-hold-pnl ${tone}`}>
                <b>{flat ? '' : delta > 0 ? '+' : '-'}{formatExactAmount(Math.abs(delta))}</b>
                <em className="asset-hold-pct">
                  {lang === 'en' ? '(' : '（'}{Math.abs(pos.pnlPct) < 0.005 ? '' : pos.pnlPct > 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%{lang === 'en' ? ')' : '）'}
                </em>
              </span>
            </span>
          </div>
        );
      })}

      {positions.some(p => p.valued) && (
        <p className="mandate-pos-note">{note}</p>
      )}
    </>
  );
}
