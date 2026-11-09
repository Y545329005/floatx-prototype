// 客户详情 · 银行卡区块（2026-11-09 方案 B；同日二次迭代）
// 分工：资料 tab = 只读列表（银行 / 卡号 / 币种 / 状态 + 加白溯源或停用原因）；
//      操作 tab = 同一列表 + 停用/恢复动作（与账户状态并列，同属风控职责）。
// 状态单一事实源 = whitelistStatus（待首充 / 已验证 / 已停用）。
// 停用必填原因（进审计 + 通知用户）；恢复按 suspendedFrom 还原并校验每币种名额（数据层做）。
// 卡片数据是模块级数组，数据层函数直接改对象属性——组件内 tick 触发重渲染即可拿到新值。
// 视觉：紧凑行式（grid 列对齐，多行成表），停用卡整行淡红底；完整卡号点开后在第二行展示，不挤压列宽。
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
  const canAct = variant === 'manage' && SUSPEND_ROLES.has(admin?.role);
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

  return (
    <div className="card kyc-review-block" key={tick}>
      <div className="admin-bank-head-row">
        <h4 className="card-title"><CreditCard size={14} /> 银行卡（{cards.length}）</h4>
        {onManage && <button className="admin-bank-manage-link" onClick={onManage}>管理 ›</button>}
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
            const hasAct = canAct && !openThis;
            return (
              <div className={`admin-bank-row ${isSuspended ? 'is-suspended' : ''}`} key={c.id}>
                <div className={`admin-bank-row-main ${hasAct ? 'has-act' : ''}`}>
                  <span className="admin-bank-name" title={c.bank}>{c.bank}{c.branch ? <i className="admin-bank-branch">{c.branch}</i> : null}</span>
                  <button
                    className="admin-bank-no-btn"
                    title={shownNo[c.id] ? undefined : '点击查看完整卡号'}
                    onClick={() => { if (!shownNo[c.id]) showNo(c); }}
                    disabled={!!shownNo[c.id]}
                  >
                    {c.maskedNo}
                    {!shownNo[c.id] && <Eye size={12} />}
                  </button>
                  <span className="admin-bank-currency">{c.currency}</span>
                  <span className={`admin-white-badge ${meta.cls}`}>{meta.label}</span>
                  {hasAct && (
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
                {shownNo[c.id] && c.cardNo && (
                  <div className="admin-bank-meta is-mono">完整卡号 {c.cardNo}</div>
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
      {variant === 'manage' && cards.length > 0 && (
        <p className="admin-bank-note-foot">白名单由首充核销自动完成，此处只做风控停用 / 恢复</p>
      )}
    </div>
  );
}
