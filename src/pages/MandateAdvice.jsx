import { useState } from 'react';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import DocViewport from '../components/DocViewport';
import {
  mandateTrades,
  mandateAccounts,
  MANDATE_TRADE_STATUS,
  currentUser,
  platformBrand,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useLang } from '../i18n';

// 成交通知单（2026-11-13 批 3 · 协议 11.2「每笔交易向客户发出成交通知」）
// 触发口径：交易复核生效后才生成——录入值可能被驳回，提前出单就是通知一个不存在的事实。
// 作废后重录的交易标「更正」：客户会同时持有两张单，必须能分清哪张有效。

// 编号回退（2026-11-16）：同一批生效交易按交易日排序取序号，格式 ADV-2026-11-00N
function derivedAdviceNo(trade) {
  const actives = mandateTrades
    .filter(x => x.status === MANDATE_TRADE_STATUS.ACTIVE)
    .slice()
    .sort((a, b) => `${a.tradeDate}${a.id}`.localeCompare(`${b.tradeDate}${b.id}`));
  const idx = actives.findIndex(x => x.id === trade.id);
  const seq = String((idx < 0 ? actives.length : idx) + 1).padStart(3, '0');
  return `ADV-${String(trade.tradeDate).slice(0, 7)}-${seq}`;
}

export default function MandateAdvice({ id, goBack }) {
  const { t } = useLang();
  const [printNote, setPrintNote] = useState('');
  const trade = mandateTrades.find(x => x.id === id);
  const account = trade ? mandateAccounts.find(a => a.id === trade.accountId) : null;

  const back = () => goBack('#mandate-trades');

  if (!trade || !account || trade.status !== MANDATE_TRADE_STATUS.ACTIVE) {
    return (
      <div className="page doc-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={back} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t('成交通知单')}</h1>
          </div>
        </div>
        <div className="card">
          <p className="doc-unready-title">{t('该单据尚未生成')}</p>
          <p className="text-muted text-sm">{t('交易经复核生效后，才会生成成交通知单。')}</p>
        </div>
      </div>
    );
  }

  const download = () => {
    if (typeof window === 'undefined') return;
    if (window.parent !== window) {
      setPrintNote(t('请在独立浏览器中打开后导出'));
      return;
    }
    setPrintNote('');
    window.print();
  };

  const amountHKD = trade.quantity * trade.price * trade.fxRate;
  const feeHKD = (Number(trade.fee) || 0) * trade.fxRate;
  // 净额（2026-11-16）：账户实际扣/收的是这个数，缺了它客户拿单对不上账
  const netHKD = trade.side === 'buy' ? amountHKD + feeHKD : amountHKD - feeHKD;
  // 对客编号：复核生效即定号（adviceNo）。旧快照里的交易没有该字段，按「交易日 + 生效顺序」派生，
  // 与种子编号同一格式；绝不把内部 id（mt2）印在给客户的单据上。
  const docNo = trade.adviceNo || derivedAdviceNo(trade);

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={back} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('成交通知单')}</h1>
        </div>
      </div>

      <DocViewport>
      <article className="doc-sheet">
        <header className="doc-head">
          <div>
            <div className="doc-brand">{platformBrand.nameZh}</div>
            <div className="doc-title">{t('成交通知单')}</div>
          </div>
          <div className="doc-meta">
            <span>{t('单据编号')} {docNo}</span>
            <span>{t('列印日期')} {String(trade.reviewedAt || '').slice(0, 10)}</span>
          </div>
        </header>

        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(currentUser.name)}</b></div>
          <div><span>{t('委托账户')}</span><b>{account.no}</b></div>
        </div>

        {trade.correctionOf && (
          <p className="doc-correct">{t('本单为更正单：原交易已作废，以本单为准。')}</p>
        )}

        <div className="doc-amount">
          <span>{t('成交金额（折合 HKD）')}</span>
          <b>{formatExactAmount(amountHKD)}</b>
        </div>

        <div className="doc-table-wrap">
          <table className="doc-table doc-table-kv">
            <tbody>
              <tr><th>{t('证券名称')}</th><td>{trade.name}（{trade.symbol}）</td></tr>
              <tr><th>{t('交易方向')}</th><td>{trade.side === 'buy' ? t('买入') : t('卖出')}</td></tr>
              <tr><th>{t('交易日')}</th><td>{trade.tradeDate}</td></tr>
              <tr><th>{t('交收日')}</th><td>{trade.settleDate || '—'}</td></tr>
              <tr><th>{t('数量')}</th><td>{formatShares(trade.quantity)} {t('股')}</td></tr>
              <tr><th>{t('成交价')}</th><td>{trade.price} {trade.currency}</td></tr>
              <tr><th>{t('费用')}</th><td>{trade.fee} {trade.currency}</td></tr>
              <tr><th>{t('汇率（折 HKD）')}</th><td>{trade.fxRate}</td></tr>
              {/* 成交金额不含费，净额才是账户实际变动；两者都在，才对得上结单与资金记录 */}
              <tr>
                <th>{trade.side === 'buy' ? t('应付金额（折合 HKD）') : t('应收金额（折合 HKD）')}</th>
                <td><strong>{formatExactAmount(netHKD)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {trade.adviceMail && (
          <p className="doc-mail-note">
            <Mail size={14} /> {t('本通知已发送至您的登记邮箱。')}
          </p>
        )}

        {/* 2026-11-16 精简：删托管归属（账户结构，协议正文第一条已有；且托管人不对客点名）
            与「不构成投资建议」（成交单不是营销材料），只留核对窗口这一句有行动价值的话 */}
        <p className="doc-legal">
          {t('本通知为成交记录。如对成交内容有疑问，请于收到后 7 天内联系客户经理。')}
        </p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
        </footer>
      </article>
      </DocViewport>

      {printNote && <p className="statement-print-note">{printNote}</p>}

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={download}>
          <Download size={16} /> {t('导出')}
        </button>
      </div>
    </div>
  );
}
