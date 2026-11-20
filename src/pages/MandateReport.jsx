import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import DocViewport from '../components/DocViewport';
import {
  getMandateReportById,
  MANDATE_FEE_TYPES,
  MANDATE_VALUATION_METHODS,
  formatExactAmount,
  formatShares,
  platformBrand,
} from '../mock/data';
import { useLang } from '../i18n';

// 委托月报（2026-11-20 · 协议 11.3）
// 客户端只读「已出具」的记录：月报是合同义务单据，出具时快照冻结，
// 页面不再回算任何数字（回算会让客户手里的版本与后台变化）。
// 版式沿用账户结单：单纸排版 + DocViewport，手机看查看态，不另做屏幕版。

export default function MandateReport({ id, goBack }) {
  const { t } = useLang();
  const [printNote, setPrintNote] = useState('');
  const record = getMandateReportById(id);

  if (!record) {
    return (
      <div className="page doc-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#mandate-statements')}><ArrowLeft size={20} /></button>
            <h1>{t('委托月报')}</h1>
          </div>
        </div>
        <div className="card"><p className="text-muted">{t('该月报不存在或已撤回')}</p></div>
      </div>
    );
  }

  const s = record.snapshot;
  const rateOf = (code) => {
    const hit = (s.fx || []).find(f => f.currency === code);
    return hit ? Number(hit.rate) || 1 : 1;
  };
  const toHKD = (amount, code) => Math.round((Number(amount) || 0) * rateOf(code) * 100) / 100;
  const signed = (v) => `${v >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(v))}`;
  const feeHKDOf = (f) => toHKD(f.amount, f.currency);
  const cashHKDOf = (c) => toHKD(c.balance, c.currency);
  const nonHKD = (s.fx || []).filter(f => f.currency !== 'HKD');
  // 同一事实不两处：只有出现非 HKD 时才需要「原币 + 折合」两列；
  // 全是 HKD 时再加一列折合，等于把同一个数写两遍。
  const feeMulti = s.fees.some(f => f.currency !== 'HKD');
  const cashMulti = s.cash.some(c => c.currency !== 'HKD');

  const download = () => {
    if (typeof window === 'undefined') return;
    if (window.parent !== window) {
      setPrintNote(t('请在独立浏览器中打开后导出'));
      return;
    }
    setPrintNote('');
    window.print();
  };

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#mandate-statements')}><ArrowLeft size={20} /></button>
          <h1>{t('委托月报')}</h1>
        </div>
      </div>

      <DocViewport>
        <article className="doc-sheet">
          <header className="doc-head">
            <div>
              <div className="doc-brand">{platformBrand.nameZh}</div>
              <div className="doc-title">{t('委托月报')}</div>
            </div>
            <div className="doc-meta">
              <span>{t('编号')} {record.docNo}</span>
              <span>{t('报告期间')} {record.period}</span>
              <span>{t('出具日')} {String(record.issuedAt).slice(0, 10)}</span>
            </div>
          </header>

          <div className="doc-client">
            <div><span>{t('客户名称')}</span><b>{t(record.userName)}</b></div>
            <div><span>{t('委托账户')}</span><b>{record.accountNo}</b></div>
            <div><span>{t('出具人')}</span><b>{record.issuedBy}</b></div>
          </div>

          <h2 className="doc-section-title">{t('一、账户概览')}</h2>
          <div className="doc-table-wrap">
            <table className="doc-table doc-table--fit">
              <thead>
                <tr>
                  <th>{t('项目')}</th>
                  <th className="num">HKD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('期初市值')}</td>
                  <td className="num">{s.openingHKD == null ? '—' : formatExactAmount(s.openingHKD)}</td>
                </tr>
                <tr>
                  <td>{t('期间资金变动')}</td>
                  <td className={`num ${s.netFlowHKD >= 0 ? 'in' : 'out'}`}>{s.netFlowHKD == null ? '—' : signed(s.netFlowHKD)}</td>
                </tr>
                <tr>
                  <td>{t('市值变动')}</td>
                  <td className={`num ${s.marketDeltaHKD >= 0 ? 'in' : 'out'}`}>{s.marketDeltaHKD == null ? '—' : signed(s.marketDeltaHKD)}</td>
                </tr>
                <tr className="doc-total">
                  <td>{t('期末市值')}</td>
                  <td className="num">{formatExactAmount(s.closingHKD)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="doc-note">
            {t('按当月 {n} 天日结单汇总；市值变动为差额扣除资金变动后的残差。').replace('{n}', String(s.days))}
          </p>

          <h2 className="doc-section-title">{t('二、期末持仓')}</h2>
          {s.positions.length === 0 ? (
            <p className="doc-empty">{t('期末无持仓')}</p>
          ) : (
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>{t('持仓')}</th>
                    <th className="num">{t('数量')}</th>
                    <th className="num">{t('估值价')}</th>
                    <th>{t('估值方法')}</th>
                    <th className="num">{t('市值（HKD）')}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.positions.map(p => (
                    <tr key={p.symbol}>
                      <td className="wrap">{p.symbol} · {p.name}</td>
                      <td className="num">{formatShares(p.quantity)}</td>
                      <td className="num">
                        {p.price == null ? t('按成本') : p.price}
                        {p.priceAt ? <span className="doc-sub">{p.priceAt}</span> : null}
                      </td>
                      <td>{t(MANDATE_VALUATION_METHODS[p.method] || p.method || '—')}</td>
                      <td className="num">{formatExactAmount(p.marketValueHKD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="doc-section-title">{t('三、费用明细')}</h2>
          {s.fees.length === 0 ? (
            <p className="doc-empty">{t('本期无费用')}</p>
          ) : (
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>{t('期间')}</th>
                    <th>{t('类型')}</th>
                    <th className="num">{feeMulti ? t('金额') : t('金额（HKD）')}</th>
                    {feeMulti && <th className="num">{t('折合 HKD')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {s.fees.map(f => (
                    <tr key={f.id}>
                      <td>{f.period}</td>
                      <td>{t(MANDATE_FEE_TYPES[f.type] || f.type)}</td>
                      <td className="num">{feeMulti ? `${f.currency} ${formatExactAmount(f.amount)}` : formatExactAmount(f.amount)}</td>
                      {feeMulti && <td className="num">{formatExactAmount(feeHKDOf(f))}</td>}
                    </tr>
                  ))}
                  <tr className="doc-total">
                    <td colSpan={feeMulti ? 3 : 2}>{t('费用合计')}</td>
                    <td className="num">{formatExactAmount(s.feeHKD)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <h2 className="doc-section-title">{t('四、现金余额')}</h2>
          <div className="doc-table-wrap">
            <table className="doc-table doc-table--fit">
              <thead>
                <tr>
                  <th>{t('币种')}</th>
                  <th className="num">{cashMulti ? t('余额') : t('余额（HKD）')}</th>
                  {cashMulti && <th className="num">{t('折合 HKD')}</th>}
                </tr>
              </thead>
              <tbody>
                {s.cash.map(c => (
                  <tr key={c.currency}>
                    <td>{c.currency}</td>
                    <td className="num">{cashMulti ? formatExactAmount(c.balance) : formatExactAmount(cashHKDOf(c))}</td>
                    {cashMulti && <td className="num">{formatExactAmount(cashHKDOf(c))}</td>}
                  </tr>
                ))}
                {s.cash.length === 0 && <tr><td colSpan={cashMulti ? 3 : 2}>{t('期末无现金余额')}</td></tr>}
              </tbody>
            </table>
          </div>

          {nonHKD.length > 0 && (
            <>
              <h2 className="doc-section-title">{t('折算汇率')}</h2>
              <div className="doc-table-wrap">
                <table className="doc-table doc-table--fit">
                  <thead>
                    <tr>
                      <th>{t('币种')}</th>
                      <th className="num">{t('汇率（折 HKD）')}</th>
                      <th>{t('更新日')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonHKD.map(f => (
                      <tr key={f.currency}>
                        <td>{f.currency}</td>
                        <td className="num">{f.rate}</td>
                        <td>{f.updatedAt || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="doc-legal">
            {t('收益一律费前，费用在结单中单列。本报告依据当月已生成的日结单汇总，未生成日不计入；期末取当月最后一份日结单。')}
          </p>
          <p className="doc-legal">{t('本报告为委托账户月度报告，与账户结单不一致时，委托部分以本报告为准。')}</p>
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
          <Download size={16} /> {t('下载')}
        </button>
      </div>
    </div>
  );
}
