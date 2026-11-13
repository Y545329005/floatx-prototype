import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import {
  advanceStatementExport, statementExportExpired, statementExportExpiresAt,
  statementExportsOf,
} from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   导出记录（2026-11-12）
   为什么单独一页：客户要的不是「刚才那张 PDF」，而是「我申请过的在哪、还下不下载得到」。
   状态只有三档（申请中 / 申请成功 / 申请失败），30 天有效期只影响下载入口，不影响记录留存。
   ───────────────────────────────────────────────────────────── */

const STATUS_META = {
  processing: { label: '申请中', cls: 'is-processing' },
  ready: { label: '申请成功', cls: 'is-ready' },
  failed: { label: '申请失败', cls: 'is-failed' },
};

export default function FundStatementExports({ navigate, goBack }) {
  const { t } = useLang();
  const [tick, setTick] = useState(0);

  const rows = useMemo(() => statementExportsOf()
    .slice()
    .sort((a, b) => String(b.requestedAt || '').localeCompare(String(a.requestedAt || ''))), [tick]);

  // 原型没有后端出 PDF：进页面后 2 秒把「申请中」推进为「申请成功」，让状态机在演示里走完。
  // 真实系统由后端回调改状态，这一段整块删掉。
  useEffect(() => {
    const pending = statementExportsOf().filter(r => r.status === 'processing');
    if (!pending.length) return undefined;
    const timer = setTimeout(() => {
      pending.forEach(r => advanceStatementExport(r.id));
      setTick(x => x + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [tick]);

  const openRecord = (rec) => {
    if (rec.status !== 'ready' || !rec.targetHref || statementExportExpired(rec)) return;
    navigate(rec.targetHref);
  };

  return (
    <div className="page fund-statement-exports-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('导出记录')}</h1>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-statements-empty">
          <FileText size={22} />
          <p className="p-statements-empty-title">{t('暂无导出记录')}</p>
          <p className="p-statements-empty-hint">{t('在账户结单或交易确认单中导出后，记录会出现在这里')}</p>
        </div>
      ) : (
        <>
          <p className="p-statements-hint">{t('结单在 30 天内可下载，过期入口失效。')}</p>
          <div className="p-statements-card">
            {rows.map(rec => {
              const meta = STATUS_META[rec.status] || STATUS_META.processing;
              const expired = rec.status === 'ready' && statementExportExpired(rec);
              const expiresAt = statementExportExpiresAt(rec);
              const downloadable = rec.status === 'ready' && !expired && !!rec.targetHref;
              return (
                <div key={rec.id} className="p-export-row">
                  <div className="p-export-head">
                    <span className="p-export-title">
                      {/* 与结单页页签同名：同一份单据在两处叫两个名字会让人找不到 */}
                      {t(rec.kind === 'period' ? '账户结单' : '交易确认单')}
                    </span>
                    <span className={`p-export-status ${meta.cls}`}>{t(meta.label)}</span>
                  </div>

                  <div className="p-export-kv">
                    {/* 「操作时间」：下载和发送都会写记录，动作不止「申请」一种 */}
                    <span>{t('操作时间')}</span>
                    <b>{rec.requestedAt}</b>
                  </div>
                  <div className="p-export-kv">
                    <span>{t('导出范围')}</span>
                    <b>
                      {rec.fundName
                        ? `${t(rec.fundName)} · ${t(rec.tradeType || '认购')}`
                        : (rec.rangeFrom ? `${rec.rangeFrom} – ${rec.rangeTo}` : (rec.scopeLabel || '—'))}
                    </b>
                  </div>

                  {rec.status === 'ready' && (
                    <div className="p-export-foot">
                      <span className={expired ? 'is-muted' : ''}>
                        {expired
                          ? t('已过期，请重新申请')
                          : t('有效期至 {date}').replace('{date}', expiresAt)}
                      </span>
                      <button
                        type="button"
                        className="p-export-download"
                        disabled={!downloadable}
                        aria-label={t('下载')}
                        onClick={() => openRecord(rec)}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}

                  {rec.status === 'failed' && rec.failReason && (
                    <p className="p-export-fail">{t(rec.failReason)}</p>
                  )}

                  {rec.status === 'processing' && (
                    <p className="p-export-pending">{t('正在生成，稍后刷新可见')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
