import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { fundStatements, formatExactAmount, formatShares } from '../mock/data';
import { useLang } from '../i18n';

// 确认单详情（2026-11-05 第二版）
// 结构：一张明细表，不再有「抬头两栏（名 ↔ 金额）+ 明细 key-value」两套排版并存。
// 口径：
//   · 金额是明细的第一行而不是抬头装饰——它和份额、净值、手续费同属「这笔成交的数字」；
//   · 日期只保留两个职责不同的：抬头「认购 · 成交日」与「确认时间」（含时分秒）；
//     净值日只在和成交日不同时出现，相同就是同一个事实说两遍。
export default function FundStatementDetail({ id, navigate, goBack }) {
  const { t } = useLang();
  const [printNote, setPrintNote] = useState('');
  const s = (fundStatements || []).find(x => x.id === id);

  if (!s) {
    return (
      <div className="page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t('确认单详情')}</h1>
          </div>
        </div>
        <div className="card"><p className="text-muted">{t('确认单不存在')}</p></div>
      </div>
    );
  }

  // 费率不落库、从单据自身反推：手续费 ÷ 计费基数。
  // 认购按成交金额计费，赎回按赎回总额计费——两者都取单据快照里的数，改费率不会篡改历史单据。
  const feeBase = s.tradeType === '赎回' ? (s.grossAmount || s.amount) : s.amount;
  const feeRate = feeBase > 0 ? (Number(s.feeAmount) / Number(feeBase)) * 100 : 0;
  const feeRateText = feeRate > 0 ? `${feeRate.toFixed(2)}%` : '';

  // 净值日与成交日相同则不重复展示
  const showNavDate = !!(s.navDate && s.navDate !== s.date);

  // 嵌入壳（iframe）里 window.print 会被宿主拦截：提示而不是静默失败
  const handleDownload = () => {
    if (typeof window === 'undefined') return;
    if (window.parent !== window) {
      setPrintNote(t('请在独立浏览器中打开后下载'));
      return;
    }
    setPrintNote('');
    window.print();
  };

  return (
    <div className="page fund-statement-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('确认单详情')}</h1>
        </div>
      </div>

      <div className="card statement-card">
        {/* 纸面文头：仅打印时出现，屏幕上由吸顶标题承担 */}
        <div className="statement-print-head">
          <strong>{t('交易确认单')}</strong>
          <span>{s.statementNo}</span>
        </div>

        <div className="statement-head">
          <div className="statement-title">{t(s.fundName)}</div>
          <div className="statement-sub">{t(s.tradeType || '认购')} · {s.date}</div>
        </div>

        <div className="statement-row is-amount">
          <span>{t(s.tradeType === '赎回' ? '到账金额' : '成交金额')}</span>
          <span>{s.currency} {formatExactAmount(s.amount)}</span>
        </div>
        {s.shares > 0 && (
          <div className="statement-row"><span>{t('份额')}</span><span>{formatShares(s.shares)} {t('份')}</span></div>
        )}
        {s.nav > 0 && (
          <div className="statement-row"><span>{t('确认净值')}</span><span>{s.nav}{showNavDate ? ` · ${s.navDate}` : ''}</span></div>
        )}
        {/* 赎回总额只在它与到账金额不同（即收了赎回费）时才有信息量，
            费率为 0 时两个数一模一样，并排就是同一个事实说两遍 */}
        {s.grossAmount > 0 && s.grossAmount !== s.amount && (
          <div className="statement-row"><span>{t('赎回总额')}</span><span>{s.currency} {formatExactAmount(s.grossAmount)}</span></div>
        )}
        {s.feeAmount > 0 && (
          <>
            <div className="statement-row">
              <span>{t(s.tradeType === '赎回' ? '赎回手续费' : '认购手续费')}</span>
              <span>{s.currency} {formatExactAmount(s.feeAmount)}</span>
            </div>
            {feeRateText && (
              <div className="statement-row"><span>{t('费率')}</span><span>{feeRateText}</span></div>
            )}
          </>
        )}
        <div className="statement-row"><span>{t('确认单编号')}</span><span>{s.statementNo}</span></div>
        <div className="statement-row"><span>{t('确认时间')}</span><span>{s.confirmedAt}</span></div>

        {s.feeAmount > 0 && s.tradeType !== '赎回' && (
          <p className="statement-note">{t('手续费已含在成交金额内，不从账户额外扣款')}</p>
        )}
      </div>

      {printNote && <p className="statement-print-note">{printNote}</p>}

      <div className="bottom-action-bar">
        <button className="btn btn-outline btn-full" onClick={handleDownload}>
          <Download size={16} /> {t('下载确认单')}
        </button>
      </div>
    </div>
  );
}
