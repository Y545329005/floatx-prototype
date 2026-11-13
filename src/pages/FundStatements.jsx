import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, FileText, History } from 'lucide-react';
import { fundStatements, formatExactAmount, periodMonths } from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   结单 · 第六版（2026-11-13）：单据中心。App 语法只有三种元素：
   单据对象（月 / 笔）、进入对象的入口（chevron）、对象之间的切换（页签）。
   上一版残留的 Web 语法全部撤除：月份横滑 chips（筛选器参数）、
   卡内整宽「导出该月结单」（表单 CTA）、行尾导出胶囊（表格行操作）。
   页签 = 「账户结单 | 交易确认单」，与「我的交易」同形（.segmented-control）；
   月度行不显示金额——历史月份的期末取当前余额（无日终快照），显示即假数据；
   导出动作只留在文档页；导出记录 = header 右上图标（标注 2026-11-13：
   月结单持续增加，列表底部入口会被推得越来越远，放页面级出口才稳定）。
   ───────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'period', label: '账户结单' },
  { key: 'trade', label: '交易确认单' },
];

export default function FundStatements({ navigate, goBack }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('period');

  // 账户结单列表：「上个月」起往前 24 个自然月——当月还没过完，出了也立刻过期。
  // 24 个月演示「结单持续增长」的组织方式：按年分白卡组（标注 2026-11-13 需要日期筛选，
  // 年份分组零交互扛增长，与确认单页签同形）
  const months = useMemo(() => periodMonths(24), []);

  // 组头已标年份，行内只写月份——「2026」组头下再写「2026年10月」是同一个事实说两遍
  const monthShort = (m) => {
    if (lang === 'en') {
      const d = new Date(`${m.from}T00:00:00`);
      try {
        return d.toLocaleDateString('en-GB', { month: 'short' });
      } catch (e) { /* fallthrough */ }
    }
    const mm = m.from.slice(5, 7);
    return `${mm.startsWith('0') ? mm.slice(1) : mm}月`;
  };

  // 月度按年分组：组头在卡外（确认单同款），一年 = 一个白卡
  const monthGroups = useMemo(() => {
    const map = new Map();
    months.forEach(m => {
      const year = m.from.slice(0, 4);
      if (!map.has(year)) map.set(year, []);
      map.get(year).push(m);
    });
    return Array.from(map.entries());
  }, [months]);

  // 按确认时间倒序：种子是 push（时间正序），运行时确认是 unshift（时间倒序），
  // 两种来源混在一起，只有显式排序才稳定
  const list = useMemo(() => (fundStatements || [])
    .slice()
    .sort((a, b) => String(b.confirmedAt || b.date || '').localeCompare(String(a.confirmedAt || a.date || ''))), []);

  // 年份是确认单这页唯一的骨架：三笔单跨两年，不分组就会出现「2024 夹在两条 2026 之间」
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
          <h1>{t('结单')}</h1>
          {/* 页面级任务出口放 header：月结单持续增加，列表底部入口会被推到很深 */}
          <div className="page-header-actions">
            <button className="btn-icon" aria-label={t('导出记录')} onClick={() => navigate('#fund-statement-exports')}>
              <History size={19} />
            </button>
          </div>
        </div>

        {/* 与「我的交易」同形的分段控件：切的是对象类型，不是筛选参数 */}
        <div className="segmented-control">
          {TABS.map(item => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? 'active' : ''}
              onClick={() => setTab(item.key)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'period' && (
        monthGroups.map(([year, rows]) => (
          <section key={year} className="p-statements-group">
            <h2 className="p-statements-year">{year}</h2>
            <div className="p-statements-card">
              {rows.map(m => (
                <button
                  key={m.key}
                  type="button"
                  className="p-statements-row"
                  onClick={() => navigate(`#fund-period-statement/${m.from}/${m.to}`)}
                >
                  <span className="p-statements-main">
                    <span className="p-statements-fund">{monthShort(m)}</span>
                  </span>
                  <ChevronRight size={18} className="p-statements-go" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {tab === 'trade' && (
        list.length === 0 ? (
          <div className="p-statements-empty">
            <FileText size={22} />
            <p className="p-statements-empty-title">{t('暂无确认单')}</p>
            <p className="p-statements-empty-hint">{t('申购或赎回确认后，确认单会出现在这里')}</p>
          </div>
        ) : (
          groups.map(([year, rows]) => (
            <section key={year} className="p-statements-group">
              {/* 组标题在卡外：灰底 + 白卡的分界本身就是分组，标题只需要点明是哪一年 */}
              <h2 className="p-statements-year">{year}</h2>

              <div className="p-statements-card">
                {rows.map(s => (
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
                            {s.type === 'monthly' ? t('月结单') : t(s.tradeType || '认购')}
                          </span>
                        </span>

                        <span className="p-statements-amount">
                          <em>{s.currency}</em>
                          <b>{formatExactAmount(s.amount)}</b>
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={18} className="p-statements-go" />
                  </button>
                ))}
              </div>
            </section>
          ))
        )
      )}
    </div>
  );
}
