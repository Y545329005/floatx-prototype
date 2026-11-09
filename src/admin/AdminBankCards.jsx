// 客户详情 · 银行卡区块（2026-11-09 方案 B；同日视觉重做）
// 位置：用户管理 / 我的客户 → 客户详情。原「资金审核 → 银行卡复核」页签已删除：
// 加白由首充核销自动完成，后台没有「审核通过」动作；卡是否可用属于风控职责（合规/运营），
// 对象是客户而不是资金单据，所以归入客户详情。
// 状态单一事实源 = whitelistStatus（待首充 / 已验证 / 已停用）。
// 停用必填原因（进审计 + 通知用户）；恢复按 suspendedFrom 还原并校验每币种名额（数据层做）。
// 卡片数据是模块级数组，数据层函数直接改对象属性——组件内 tick 触发重渲染即可拿到新值。
// 视觉：每张卡一条浅纸底凭证行（不是嵌套卡片）；状态靠右、动作贴卡号行右端，
// 加白来源 / 停用原因是次级事实，12px 单行；说明压到标题右侧一行，不占版面。
import { useState } from 'react';
import { CreditCard, ShieldAlert, RotateCcw, ShieldCheck, Eye } from 'lucide-react';
import { BANK_CARD_STATUS, suspendBankCard, restoreBankCard, formatExactAmount, logAudit } from '../mock/data';

const CARD_STATUS_META = {
  [BANK_CARD_STATUS.VERIFIED]: { label: '已验证', cls: 'is-ok' },
  [BANK_CARD_STATUS.UNVERIFIED]: { label: '待首充', cls: 'is-warn' },
  [BANK_CARD_STATUS.SUSPENDED]: { label: '已停用', cls: 'is-bad' },
};

// 停用/恢复 = 风控动作：合规、运营与超管可操作；客服（只读查询）与顾问（客户关系）不显示按钮
const SUSPEND_ROLES = new Set(['super', 'ops', 'compliance']);

export default function AdminBankCards({ cards, admin, variant = 'manage', onManage }) {
  const [tick, setTick] = useState(0);
  const [shownNo, setShownNo] = useState({});   // 卡号明文展开（逐卡，留痕）
  const [acting, setActing] = useState(null);   // { cardId, mode: 'suspend' | 'restore' }
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const canAct = SUSPEND_ROLES.has(admin?.role);
  const operator = admin?.name || '运营后台';

  const showNo = (c) => {
    setShownNo(prev => ({ ...prev, [c.id]: true }));
    logAudit({ operator, category: 'fundProduct', action: 'view', target: '银行卡号明文', targetId: c.id, note: `查看银行卡号明文：${c.maskedNo}` });
  };
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

  // 摘要形态（资料 tab）：只回答「有几张、什么状态」，动作与明细进操作 tab
  if (variant === 'summary') {
    const count = (st) => cards.filter(c => c.whitelistStatus === st).length;
    return (
      <div className="card kyc-review-block">
        <div className="admin-bank-head-row">
          <h4 className="card-title"><CreditCard size={14} /> 银行卡（{cards.length}）</h4>
          {onManage && <button className="admin-bank-manage-link" onClick={onManage}>管理 ›</button>}
        </div>
        {cards.length === 0 ? (
          <div className="admin-bank-empty">暂未绑定银行卡</div>
        ) : (
          <div className="admin-bank-summary">
            <span className="admin-bank-sum-item"><i className="admin-bank-sum-dot is-ok" />已验证 <b className="admin-bank-sum-num">{count(BANK_CARD_STATUS.VERIFIED)}</b></span>
            <span className="admin-bank-sum-item"><i className="admin-bank-sum-dot is-warn" />待首充 <b className="admin-bank-sum-num">{count(BANK_CARD_STATUS.UNVERIFIED)}</b></span>
            <span className="admin-bank-sum-item"><i className="admin-bank-sum-dot is-bad" />已停用 <b className="admin-bank-sum-num">{count(BANK_CARD_STATUS.SUSPENDED)}</b></span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card kyc-review-block" key={tick}>
      <div className="admin-bank-head-row">
        <h4 className="card-title"><CreditCard size={14} /> 银行卡（{cards.length}）</h4>
        {cards.length > 0 && (
          <span className="admin-bank-note">白名单由首充核销自动完成，此处只做风控停用</span>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="admin-bank-empty">暂未绑定银行卡</div>
      ) : (
        <div className="admin-bank-list">
          {cards.map(c => {
            const meta = CARD_STATUS_META[c.whitelistStatus] || CARD_STATUS_META[BANK_CARD_STATUS.UNVERIFIED];
            const isSuspended = c.whitelistStatus === BANK_CARD_STATUS.SUSPENDED;
            const isVerified = c.whitelistStatus === BANK_CARD_STATUS.VERIFIED;
            const openThis = acting && acting.cardId === c.id;
            return (
              <div className={`admin-bank-item ${isSuspended ? 'is-suspended' : ''}`} key={c.id}>
                <div className="admin-bank-head">
                  <div className="admin-bank-name-wrap">
                    <strong className="admin-bank-name">{c.bank}</strong>
                    {c.branch && <span className="admin-bank-branch">{c.branch}</span>}
                  </div>
                  <span className={`admin-white-badge ${meta.cls}`}>{meta.label}</span>
                </div>

                <div className="admin-bank-body">
                  <span className="admin-bank-no">
                    {shownNo[c.id]
                      ? (c.cardNo || c.maskedNo)
                      : (
                        <button className="admin-bank-no-btn" title="点击查看完整卡号" onClick={() => showNo(c)}>
                          {c.maskedNo}
                          <Eye size={13} />
                        </button>
                      )}
                  </span>
                  <span className="admin-bank-currency">{c.currency}</span>
                  {canAct && !openThis && (
                    isSuspended ? (
                      <button className="btn btn-sm btn-outline admin-bank-act" onClick={() => start(c.id, 'restore')}>
                        <RotateCcw size={13} /> 恢复
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline admin-bank-act" onClick={() => start(c.id, 'suspend')}>
                        <ShieldAlert size={13} /> 停用该卡
                      </button>
                    )
                  )}
                </div>

                {isVerified && (
                  <div className="admin-bank-meta">
                    <ShieldCheck size={12} />
                    <span>
                      加白 {c.verifiedByReqId ? `首充 ${c.verifiedByReqId}` : ''}{c.verifiedBy ? ` · ${c.verifiedBy}` : ''}{c.verifiedAt ? ` · ${c.verifiedAt}` : ''}{c.verifiedAmount != null ? ` · 到账 ${c.currency} ${formatExactAmount(c.verifiedAmount)}` : ''}
                    </span>
                  </div>
                )}
                {isSuspended && (
                  <div className="admin-bank-meta is-bad">
                    <ShieldAlert size={12} />
                    <span>
                      停用 {c.reviewReason || '风控停用'}{c.suspendedBy ? ` · ${c.suspendedBy}` : ''}{c.suspendedAt ? ` · ${c.suspendedAt}` : ''}
                    </span>
                  </div>
                )}

                {openThis && (
                  <div className="admin-bank-form">
                    <textarea
                      className={`form-input ${error ? 'field-error' : ''}`}
                      rows={2}
                      placeholder={acting.mode === 'suspend' ? '停用原因（必填，会通知用户）' : '恢复原因（必填，进审计）'}
                      value={reason}
                      onChange={e => { setReason(e.target.value); if (error) setError(''); }}
                    />
                    {acting.mode === 'suspend' && (
                      <p className="admin-bank-form-hint">停用后该卡不可出入金，用户需解绑后重新添加并完成首充验证。</p>
                    )}
                    {error && <div className="form-error">{error}</div>}
                    <div className="admin-bank-form-btns">
                      <button className="btn btn-sm btn-secondary" onClick={cancel}>取消</button>
                      <button className={`btn btn-sm ${acting.mode === 'suspend' ? 'btn-outline' : 'btn-primary'}`} onClick={submit}>
                        {acting.mode === 'suspend' ? '确认停用' : '确认恢复'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
