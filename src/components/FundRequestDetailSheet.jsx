import { X } from 'lucide-react';
import { wallet, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

const reqStatusLabels = { pending: '审核中', approved: '已到账', rejected: '已拒绝' };

// 资金申请详情 sheet（2026-08-18：钱包页摘要行 + 资金申请独立页共用）
// 展示后台审核抽屉同源信息：单号/银行参考号/到账账户/拒绝原因/处理人时间（对齐 AdminFunds 心智）
export default function FundRequestDetailSheet({ req, onClose }) {
  const { t } = useLang();
  const isDeposit = req.kind === 'deposit';
  const symbol = (wallet[String(req.currency || '').toLowerCase()] || {}).symbol || '';
  const statusLabel = reqStatusLabels[req.status] || req.status;
  const statusCls = req.status === 'approved' ? 'tag-success' : req.status === 'rejected' ? 'tag-danger' : 'tag-warning';

  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <h3>{t(isDeposit ? '充值申请详情' : '提现申请详情')}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="fund-form">
          <div className="detail-stat-row">
            <div className="detail-stat">
              <span className="detail-stat-label">{t('金额')}</span>
              <span className="detail-stat-value">
                {isDeposit ? '+' : '-'}{symbol}{formatCurrency(req.amount)}
              </span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">{t('状态')}</span>
              <span className="detail-stat-value">
                <span className={`tag ${statusCls}`}>{t(statusLabel)}</span>
              </span>
            </div>
          </div>

          <div className="subscription-info-row">
            <span className="text-muted">{t('申请单号')}</span>
            <strong className="date-iso">{req.orderNo}</strong>
          </div>
          <div className="subscription-info-row">
            <span className="text-muted">{t('币种')}</span>
            <strong>{req.currency}</strong>
          </div>
          <div className="subscription-info-row">
            <span className="text-muted">{t('到账账户')}</span>
            <strong>{req.bank || '—'} {req.cardNo || ''}</strong>
          </div>
          {req.bankRef && (
            <div className="subscription-info-row">
              <span className="text-muted">{t('银行参考号')}</span>
              <strong className="date-iso">{req.bankRef}</strong>
            </div>
          )}
          <div className="subscription-info-row">
            <span className="text-muted">{t('申请时间')}</span>
            <strong>{req.createdAt}</strong>
          </div>
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

          <button className="btn btn-primary btn-full sheet-submit" onClick={onClose}>{t('完成')}</button>
        </div>
      </div>
    </>
  );
}