import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import {
  fundStatements, formatExactAmount, formatShares, currentUser, platformBrand,
  requestStatementExport, advanceStatementExport,
} from '../mock/data';
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
    // 记录写死在 print 之前：打印对话框的「取消」无法感知，记录只能算「发起过」
    // 下载是本地动作，不要求收件邮箱；手动「发送到邮箱」已下线（2026-11-13，
    // 确认单按 SFC 口径自动送达，手动补发与自动送达重复）
    logExport();
    window.print();
  };

  const logExport = () => {
    const res = requestStatementExport({
      kind: 'confirmation',
      fundName: s.fundName,
      tradeType: s.tradeType || '认购',
      targetHref: `#fund-statement/${s.id}`,
      requireMailbox: false,
    });
    if (res.ok) advanceStatementExport(res.record.id);
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
          <div className="statement-print-brand">
            <strong>{platformBrand.nameZh}</strong>
            <span>{t('交易确认单')}</span>
          </div>
          <div className="statement-print-meta">
            <span>{t('编号')} {s.statementNo}</span>
          </div>
        </div>

        {/* 客户块同样只在纸面出现：屏幕上客户就是本人，没必要重复一遍身份 */}
        <div className="statement-print-client">
          <div><span>{t('客户名称')}</span><b>{t(currentUser.name)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{String(currentUser.id).toUpperCase()}</b></div>
        </div>

        <div className="statement-head">
          <div className="statement-title">{t(s.fundName)}</div>
          <div className="statement-sub">{t(s.tradeType || '认购')}</div>
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
          <div className="statement-row">
            <span>{t(s.tradeType === '赎回' ? '赎回手续费' : '认购手续费')}</span>
            <span>{s.currency} {formatExactAmount(s.feeAmount)}</span>
          </div>
        )}
        {/* 两个日期职责不同（2026-11-13 会议口径）：交易日=市场事实（何时成交），发出时间=合规事实（何时送达）。
            confirmedAt 含时分秒，标签用「发出时间」而不是「发出日」——粒度和标签要一致 */}
        <div className="statement-row"><span>{t('交易日')}</span><span>{s.date}</span></div>
        {s.settleDate && (
          <div className="statement-row"><span>{t('结算日期')}</span><span>{s.settleDate}</span></div>
        )}
        <div className="statement-row"><span>{t('发出时间')}</span><span>{s.confirmedAt}</span></div>

        {s.feeAmount > 0 && s.tradeType !== '赎回' && (
          <p className="statement-note">{t('手续费已含在成交金额内，不从账户额外扣款')}</p>
        )}

        {/* 纸面页脚：屏幕上是噪音，纸上没有它就不像一份可存档的凭证 */}
        <div className="statement-print-legal">
          <p>{t('本确认单由电脑系统自动生成，无需签署。如对内容有疑问，请于收到后 7 天内联系客户经理；否则视为确认无误。')}</p>
          <p>{t('基金投资涉及风险，过往业绩不代表未来表现。')}</p>
          <div className="statement-print-foot">
            <span>
              {platformBrand.nameFullZh} · {t(platformBrand.licenseType)} · {t('中央编号')} {platformBrand.licenseNo}
            </span>
            <span>1 / 1</span>
          </div>
        </div>
      </div>

      {printNote && <p className="statement-print-note">{printNote}</p>}

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={handleDownload}>
          <Download size={16} /> {t('下载确认单')}
        </button>
      </div>
    </div>
  );
}
