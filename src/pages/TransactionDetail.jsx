import { ArrowLeft } from 'lucide-react';
import { transactions, walletAccountOf, formatExactAmount } from '../mock/data';
import { useLang } from '../i18n';

// 资金流水详情独立页（2026-11-02：无申请单的历史导入流水详情出口，样式复用资金申请详情 fund-detail-* 体系）
// 与 #fund-request/:id 的分工：那边是「申请单」全生命周期（有凭证/补传交互），这边是「记账凭证」纯只读。
// 资金明细列表所有行统一点击跳详情：审批流水 → 申请详情，历史流水 → 本页。
export default function TransactionDetail({ id, goBack }) {
  const { t } = useLang();
  const tx = transactions.find(x => x.id === id);

  if (!tx || (tx.type !== 'deposit' && tx.type !== 'withdraw')) {
    return (
      <div className="page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#transactions')}><ArrowLeft size={20} /></button>
            <h1>{t('交易详情')}</h1>
          </div>
        </div>
        <div className="empty-state">
          <p className="text-muted">{t('未找到该交易记录')}</p>
        </div>
      </div>
    );
  }

  const isDeposit = tx.type === 'deposit';
  const symbol = walletAccountOf(tx.currency)?.symbol || '';

  return (
    <div className="page fund-request-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#transactions')}><ArrowLeft size={20} /></button>
          <h1>{t('交易详情')}</h1>
        </div>
      </div>

      <div className="fund-detail-hero">
        <div className="fund-detail-hero-amount">
          {isDeposit ? '+' : '-'}{symbol}{formatExactAmount(tx.amount)}
        </div>
        <span className="tag tag-success">{t('已完成')}</span>
      </div>

      <div className="card fund-detail-card">
        <div className="subscription-info-row">
          <span className="text-muted">{t('交易类型')}</span>
          <strong>{t(isDeposit ? '充值' : '提现')}</strong>
        </div>
        <div className="subscription-info-row">
          <span className="text-muted">{t('币种')}</span>
          <strong>{tx.currency}</strong>
        </div>
        {/* 账户行（2026-11-02 字段对齐）：历史导入流水补 bank/cardNo 后与申请单页公共字段对齐；充值=付款账户、提现=收款账户 */}
        {(tx.bank || tx.cardNo) && (
          <div className="subscription-info-row">
            <span className="text-muted">{t(tx.type === 'deposit' ? '付款账户' : '收款账户')}</span>
            <strong>{tx.bank || ''} {tx.cardNo || ''}</strong>
          </div>
        )}
        {tx.method && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('渠道')}</span>
            <strong>{tx.method}</strong>
          </div>
        )}
        {tx.orderNo && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('订单号')}</span>
            <strong className="date-iso">{tx.orderNo}</strong>
          </div>
        )}
        {tx.reference && (
          <div className="subscription-info-row">
            <span className="text-muted">{t('参考号')}</span>
            <strong className="date-iso">{tx.reference}</strong>
          </div>
        )}
        <div className="subscription-info-row">
          <span className="text-muted">{t('记账时间')}</span>
          <strong>{tx.createdAt}</strong>
        </div>
      </div>
    </div>
  );
}
