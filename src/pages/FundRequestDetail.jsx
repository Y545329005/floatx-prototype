import { useRef, useState } from 'react';
import { clickable } from '../lib';
import { ArrowLeft, Upload } from 'lucide-react';
import { depositRequests, withdrawRequests, exchangeRequests, walletAccountOf, formatExactAmount, submitDepositEvidence, getEvidencePreview, currentUser, cancelWithdrawRequest } from '../mock/data';
import { useLang } from '../i18n';
import ImageLightbox from '../components/ImageLightbox';

// 资金申请详情独立页（2026-08-19：由抽屉改为独立页，对齐银行 APP 交易详情惯例；支持充值/提现/换汇三类型）
// 换汇：展示参考汇率/估算与实际成交汇率/到账；充值：展示转账凭证 + requires_evidence 异常态补传
function findRequest(id) {
  const d = depositRequests.find(r => r.id === id);
  if (d) return { ...d, kind: 'deposit' };
  const w = withdrawRequests.find(r => r.id === id);
  if (w) return { ...w, kind: 'withdraw' };
  const e = exchangeRequests.find(r => r.id === id);
  if (e) return { ...e, kind: 'exchange' };
  return null;
}

const statusLabel = (req) => {
  if (req.status === 'requires_evidence') return '待补凭证';
  if (req.status === 'approved') {
    if (req.kind === 'deposit') return '已到账';
    if (req.kind === 'withdraw') return '已打款';
    return '已完成';
  }
  if (req.status === 'rejected') return '已拒绝';
  if (req.status === 'cancelled') return '已撤销';
  return '处理中';
};
const statusCls = (req) =>
  req.status === 'approved' ? 'tag-success' : (req.status === 'rejected' || req.status === 'cancelled') ? 'tag-danger' : 'tag-warning';

export default function FundRequestDetail({ id, navigate, goBack }) {
  const { t } = useLang();
  const [, force] = useState(0); // 补传凭证后强制重渲染（mock 数组变更不触发 React）
  const [previewOpen, setPreviewOpen] = useState(false); // 2026-08-20 凭证放大预览
  const [confirmCancel, setConfirmCancel] = useState(false); // 2026-11-04 出金撤单二次确认
  const fileRef = useRef(null);
  let req = findRequest(id);
  // 归属校验（2026-11-02 修复：此前任何人可凭 id 深链打开他人申请单）；无归属字段的存量数据放行
  if (req && req.userId && req.userId !== currentUser.id) req = null;

  if (!req) {
    return (
      <div className="page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#transactions')}><ArrowLeft size={20} /></button>
            <h1>{t('资金申请')}</h1>
          </div>
        </div>
        <div className="empty-state">
          <p className="text-muted">{t('未找到该资金申请')}</p>
        </div>
      </div>
    );
  }

  const isDeposit = req.kind === 'deposit';
  const isExchange = req.kind === 'exchange';
  const symbol = walletAccountOf(req.currency)?.symbol || '';

  // 补传凭证：选择文件 → submitDepositEvidence → 强制刷新（异常态 requires_evidence 专用）
  const handleEvidenceFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f || !isDeposit || req.status !== 'requires_evidence') return;
    const ok = submitDepositEvidence(req.id, { name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB`, uploadedAt: '' });
    if (ok) force(n => n + 1);
  };

  return (
    <div className="page fund-request-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#transactions')}><ArrowLeft size={20} /></button>
          <h1>{t(isExchange ? '换汇申请详情' : isDeposit ? '充值申请详情' : '提现申请详情')}</h1>
        </div>
      </div>

      <div className="fund-detail-hero">
        <div className="fund-detail-hero-amount">
          {isExchange
            ? <>{req.fromCurrency} {formatExactAmount(req.amount)} → {req.toCurrency}</>
            : <>{isDeposit ? '+' : '-'}{symbol}{formatExactAmount(req.amount)}</>}
        </div>
        <span className={`tag ${statusCls(req)}`}>{t(statusLabel(req))}</span>
      </div>

      <div className="card fund-detail-card">
        <div className="subscription-info-row">
          <span className="text-muted">{t('申请单号')}</span>
          <strong className="date-iso">{req.orderNo}</strong>
        </div>

        {isExchange ? (
          <>
            <div className="subscription-info-row">
              <span className="text-muted">{t('币种对')}</span>
              <strong>{req.fromCurrency} → {req.toCurrency}</strong>
            </div>
            <div className="subscription-info-row">
              <span className="text-muted">{t('卖出金额')}</span>
              <strong>{req.fromCurrency} {formatExactAmount(req.amount)}</strong>
            </div>
            <div className="subscription-info-row">
              <span className="text-muted">{t('参考汇率')}</span>
              <strong>1 {req.fromCurrency} = {req.refRate} {req.toCurrency}</strong>
            </div>
            <div className="subscription-info-row">
              <span className="text-muted">{t('估算到账（仅供参考）')}</span>
              <strong>{req.toCurrency} {formatExactAmount(req.expectedAmount)}</strong>
            </div>
            {req.status === 'approved' && (
              <>
                <div className="subscription-info-row">
                  <span className="text-muted">{t('实际成交汇率')}</span>
                  <strong>{req.actualRate}</strong>
                </div>
                <div className="subscription-info-row">
                  <span className="text-muted">{t('实际到账')}</span>
                  <strong>{req.toCurrency} {formatExactAmount(req.actualAmount ?? req.expectedAmount)}</strong>
                </div>
                {req.bankRef && (
                  <div className="subscription-info-row">
                    <span className="text-muted">{t('银行参考号')}</span>
                    <strong className="date-iso">{req.bankRef}</strong>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="subscription-info-row">
              <span className="text-muted">{t('币种')}</span>
              <strong>{req.currency}</strong>
            </div>
            {/* 2026-10-29：参考代码回显——用户汇款备注里写的就是它，详情页要能核对（否则提交后无从复查） */}
            {isDeposit && req.refCode && (
              <div className="subscription-info-row">
                <span className="text-muted">{t('参考代码')}</span>
                <strong className="date-iso">{req.refCode}</strong>
              </div>
            )}
            {isDeposit && req.transferDate && (
              <div className="subscription-info-row">
                <span className="text-muted">{t('转账日期')}</span>
                <strong>{req.transferDate}</strong>
              </div>
            )}
            <div className="subscription-info-row">
              <span className="text-muted">{t(isDeposit ? '付款账户' : '收款账户')}</span>
              <strong>{req.bank || '—'} {req.cardNo || ''}</strong>
            </div>
            {req.method && (
              <div className="subscription-info-row">
                <span className="text-muted">{t('通道')}</span>
                <strong>{req.method}</strong>
              </div>
            )}
            {/* 出金费用（2026-11-04）：费率按下单时快照展示，手续费从金额内扣 */}
            {!isDeposit && !isExchange && req.feeRate != null && (
              <>
                <div className="subscription-info-row">
                  <span className="text-muted">{t('出金费率')}</span>
                  <strong>{req.feeRate}% · {req.isCrossBorder ? t('跨境汇款') : t('本地出金')}</strong>
                </div>
                <div className="subscription-info-row">
                  <span className="text-muted">{t('手续费')}</span>
                  <strong>{symbol}{formatExactAmount(req.feeAmount || 0)}</strong>
                </div>
                <div className="subscription-info-row">
                  <span className="text-muted">{t('实际到账')}</span>
                  <strong>{symbol}{formatExactAmount(req.netAmount != null ? req.netAmount : req.amount)}</strong>
                </div>
              </>
            )}
            {req.bankRef && (
              <div className="subscription-info-row">
                <span className="text-muted">{t('银行参考号')}</span>
                <strong className="date-iso">{req.bankRef}</strong>
              </div>
            )}
            {isDeposit && req.evidence && (
              <div className="subscription-info-row">
                <span className="text-muted">{t('转账凭证')}</span>
                <strong className="fund-evidence-view">
                  <span className="fund-evidence-name"><Upload size={13} className="inline-icon" /> {req.evidence.name}</span>
                  <button className="btn btn-sm btn-outline" onClick={() => setPreviewOpen(true)}>{t('查看凭证')}</button>
                </strong>
              </div>
            )}
          </>
        )}

        <div className="subscription-info-row">
          <span className="text-muted">{t('申请时间')}</span>
          <strong>{req.createdAt}</strong>
        </div>
        {req.status === 'approved' && isDeposit && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('实际到账')}</span>
            <strong>{symbol}{formatExactAmount(req.actualAmount ?? req.amount)}</strong>
          </div>
        )}
        {req.status === 'approved' && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('处理时间')}</span>
            <strong>{req.handledAt}{req.handledBy ? ` · ${req.handledBy}` : ''}</strong>
          </div>
        )}
        {req.status === 'rejected' && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('拒绝原因')}</span>
            <strong className="text-danger">{req.rejectReason || '—'}</strong>
          </div>
        )}
        {req.status === 'requires_evidence' && (
          <>
            <div className="subscription-info-row">
              <span className="text-muted">{t('补传原因')}</span>
              <strong className="text-danger">{req.requestEvidenceReason || '—'}</strong>
            </div>
            <div className="fund-evidence-box detail" {...clickable(() => fileRef.current && fileRef.current.click())}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleEvidenceFile}
              />
              <div className="fund-evidence-empty">
                <Upload size={20} />
                <strong>{t('补传转账凭证')}</strong>
                <span className="text-muted text-sm">{t('上传清晰凭证后重新提交核对（演示阶段仅模拟文件名）')}</span>
              </div>
            </div>
          </>
        )}
      </div>
      {/* 出金撤单（2026-11-04 · 集团 FR-05「审批通过前可撤单」）：仅待处理单、仅本人；撤销即时释放冻结 */}
      {!isDeposit && !isExchange && req.status === 'pending' && (
        confirmCancel ? (
          <div className="card fund-detail-card">
            <p className="text-muted text-sm">{t('撤销后本单将终止，冻结金额立即释放。确认撤销？')}</p>
            <div className="bank-card-confirm-actions">
              <button className="btn btn-outline btn-full" onClick={() => setConfirmCancel(false)}>{t('取消')}</button>
              <button
                className="btn btn-danger btn-full"
                onClick={() => {
                  if (cancelWithdrawRequest(req.id)) { setConfirmCancel(false); force(n => n + 1); }
                }}
              >{t('确认撤销')}</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-outline btn-full" onClick={() => setConfirmCancel(true)}>{t('撤销提现申请')}</button>
        )
      )}
      {previewOpen && req.evidence && (
        <ImageLightbox src={getEvidencePreview(req)} title={`${t('转账凭证')} · ${req.evidence.name}`} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}
