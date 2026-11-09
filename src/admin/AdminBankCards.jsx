// 客户详情 · 银行卡区块（2026-11-09 方案 B）
// 位置：用户管理 / 我的客户 → 客户详情。原「资金审核 → 银行卡复核」页签已删除：
// 加白由首充核销自动完成，后台没有「审核通过」动作；卡是否可用属于风控职责（合规/运营），
// 对象是客户而不是资金单据，所以归入客户详情。
// 状态单一事实源 = whitelistStatus（待首充 / 已验证 / 已停用）。
// 停用必填原因（进审计 + 通知用户）；恢复按 suspendedFrom 还原并校验每币种名额（数据层做）。
// 卡片数据是模块级数组，数据层函数直接改对象属性——组件内 tick 触发重渲染即可拿到新值。
import { useState } from 'react';
import { CreditCard, ShieldAlert, RotateCcw, ShieldCheck } from 'lucide-react';
import { BANK_CARD_STATUS, suspendBankCard, restoreBankCard, formatExactAmount } from '../mock/data';
import { CardNoRow } from './AdminFunds';

const CARD_STATUS_META = {
  [BANK_CARD_STATUS.VERIFIED]: { label: '已验证', cls: 'is-ok' },
  [BANK_CARD_STATUS.UNVERIFIED]: { label: '待首充', cls: 'is-warn' },
  [BANK_CARD_STATUS.SUSPENDED]: { label: '已停用', cls: 'is-bad' },
};

// 停用/恢复 = 风控动作：合规、运营与超管可操作；客服（只读查询）与顾问（客户关系）不显示按钮
const SUSPEND_ROLES = new Set(['super', 'ops', 'compliance']);

export default function AdminBankCards({ cards, admin }) {
  const [tick, setTick] = useState(0);
  const [acting, setActing] = useState(null); // { cardId, mode: 'suspend' | 'restore' }
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const canAct = SUSPEND_ROLES.has(admin?.role);
  const operator = admin?.name || '运营后台';

  const start = (cardId, mode) => { setActing({ cardId, mode }); setReason(''); setError(''); };
  const cancel = () => { setActing(null); setReason(''); setError(''); };
  const submit = () => {
    if (!reason.trim()) { setError(acting.mode === 'suspend' ? '请填写停用原因' : '请填写恢复原因'); return; }
    const res = acting.mode === 'suspend'
      ? suspendBankCard(acting.cardId, operator, reason)
      : restoreBankCard(acting.cardId, operator, reason);
    if (!res || res.ok === false) { setError((res && res.error) || '操作失败'); return; }
    cancel();
    setTick(t => t + 1); // 模块级数组已原地更新，触发一次重渲染
  };

  return (
    <div className="card kyc-review-block" key={tick}>
      <h4 className="card-title"><CreditCard size={14} /> 银行卡（{cards.length}）</h4>
      {cards.length > 0 ? cards.map(c => {
        const meta = CARD_STATUS_META[c.whitelistStatus] || CARD_STATUS_META[BANK_CARD_STATUS.UNVERIFIED];
        const isSuspended = c.whitelistStatus === BANK_CARD_STATUS.SUSPENDED;
        const isVerified = c.whitelistStatus === BANK_CARD_STATUS.VERIFIED;
        const openThis = acting && acting.cardId === c.id;
        return (
          <div className="admin-bank-card-item" key={c.id}>
            <div className="admin-bank-card-bank-row">
              <span className="admin-bank-card-bank">{c.bank}</span>
              {c.branch && <span className="admin-bank-card-branch">{c.branch}</span>}
              <span className={`admin-white-badge ${meta.cls}`}>{meta.label}</span>
            </div>
            <div className="admin-bank-card-no-row">
              <span className="admin-bank-card-currency">{c.currency}</span>
              <CardNoRow value={c.cardNo || c.maskedNo} operator={operator} targetId={c.id} label="卡号" />
            </div>
            {/* 加白溯源：谁在哪笔首充批的这张卡（白名单由核销自动完成，这里只展示结果） */}
            {isVerified && (
              <div className="admin-card-meta-line">
                <ShieldCheck size={12} />
                <span>
                  加白来源：{c.verifiedByReqId ? `首充 ${c.verifiedByReqId}` : '历史数据'}{c.verifiedBy ? ` · ${c.verifiedBy}` : ''}
                  {c.verifiedAt ? ` · ${c.verifiedAt}` : ''}
                  {c.verifiedAmount != null ? ` · 验证到账 ${formatExactAmount(c.verifiedAmount)}` : ''}
                </span>
              </div>
            )}
            {isSuspended && (
              <div className="admin-card-meta-line is-bad">
                <ShieldAlert size={12} />
                <span>停用原因：{c.reviewReason || '—'}{c.suspendedBy ? ` · ${c.suspendedBy}` : ''}{c.suspendedAt ? ` · ${c.suspendedAt}` : ''}</span>
              </div>
            )}
            {canAct && (
              openThis ? (
                <div className="admin-card-action-form">
                  <textarea
                    className={`form-input ${error ? 'field-error' : ''}`}
                    rows={2}
                    placeholder={acting.mode === 'suspend' ? '停用原因（必填，会通知用户）' : '恢复原因（必填，进审计）'}
                    value={reason}
                    onChange={e => { setReason(e.target.value); if (error) setError(''); }}
                  />
                  {error && <div className="form-error">{error}</div>}
                  <div className="admin-card-action-btns">
                    <button className="btn btn-sm btn-secondary" onClick={cancel}>取消</button>
                    <button className={`btn btn-sm ${acting.mode === 'suspend' ? 'btn-outline' : 'btn-primary'}`} onClick={submit}>
                      {acting.mode === 'suspend' ? '确认停用' : '确认恢复'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-card-action-btns">
                  {isSuspended ? (
                    <button className="btn btn-sm btn-outline" onClick={() => start(c.id, 'restore')}>
                      <RotateCcw size={13} /> 恢复
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline" onClick={() => start(c.id, 'suspend')}>
                      <ShieldAlert size={13} /> 停用该卡
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        );
      }) : <div className="text-muted text-sm">暂未绑定银行卡</div>}
      <p className="admin-form-hint">
        白名单由首充核销自动完成（财务核对到账后加白），本区块只做风控停用 / 恢复。停用后该卡不可出入金，
        用户需解绑后重新添加并完成首充验证。
      </p>
    </div>
  );
}
