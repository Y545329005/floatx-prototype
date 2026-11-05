import { useMemo } from 'react';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { fundStatements, formatExactAmount } from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   交易确认单 · 方向契约（2026-11-05 第三版）
   THESIS：名称与金额会各自变长，不能挤在同一行抢宽度。名称独占一行、
     金额退到第二行右侧，两者互不压缩。
   OWN-WORLD：沿用系统既有的分组语言——灰底页面上叠白卡，组标题在卡外。
   STORY：先看到年份，再找那一笔，点开看明细。
   FIRST VIEWPORT：2026 → 一张白卡两行；2024 → 一张白卡一行。
     行 = 基金名 / 第二行「日期 · 类型 ……… 金额」。
   FORM：既有系统的分组列表，不引入新身份。
   FINISH：unreviewed and undocumented is unfinished。
   ───────────────────────────────────────────────────────────── */

export default function FundStatements({ navigate, goBack }) {
  const { t } = useLang();

  // 按确认时间倒序：种子数据是 push 进来的（时间正序），运行时确认的是 unshift（时间倒序），
  // 两种来源混在一起，只有显式排序才稳定
  const list = (fundStatements || [])
    .slice()
    .sort((a, b) => String(b.confirmedAt || b.date || '').localeCompare(String(a.confirmedAt || a.date || '')));

  // 年份是这页唯一的骨架：三笔单跨两年，不分组就会出现「2024 夹在两条 2026 之间」
  const groups = useMemo(() => {
    const map = new Map();
    list.forEach(s => {
      const stamp = String(s.confirmedAt || s.date || '');
      const year = stamp.slice(0, 4) || '—';
      if (!map.has(year)) map.set(year, []);
      map.get(year).push(s);
    });
    return Array.from(map.entries());
  }, [list]);

  const monthDay = (s) => {
    const stamp = String(s.confirmedAt || s.date || '');
    return stamp.length >= 10 ? stamp.slice(5, 10) : stamp;
  };

  return (
    <div className="page fund-statements-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#funds')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('交易确认单')}</h1>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="p-statements-empty">
          <FileText size={22} />
          <p className="p-statements-empty-title">{t('暂无确认单')}</p>
          <p className="p-statements-empty-hint">
            {t('申购或赎回确认后，确认单会出现在这里')}
          </p>
        </div>
      ) : (
        groups.map(([year, rows]) => (
          <section key={year} className="p-statements-group">
            {/* 组标题在卡外：灰底 + 白卡的分界本身就是分组，标题只需要点明是哪一年 */}
            <h2 className="p-statements-year">{year}</h2>

            <div className="p-statements-card">
              {rows.map(s => {
                const isMonthly = s.type === 'monthly';
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="p-statements-row"
                    onClick={() => navigate(`#fund-statement/${s.id}`)}
                  >
                    <span className="p-statements-main">
                      <span className="p-statements-fund">{t(s.fundName)}</span>

                      <span className="p-statements-line2">
                        <span className="p-statements-when">
                          <span className="p-statements-date">{monthDay(s)}</span>
                          <span className="p-statements-dot">·</span>
                          <span className="p-statements-kind">
                            {isMonthly ? t('月结单') : t(s.tradeType || '认购')}
                          </span>
                        </span>

                        <span className="p-statements-amount">
                          <em>{s.currency}</em>
                          <b>{formatExactAmount(s.amount)}</b>
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={14} className="p-statements-chev" />
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
