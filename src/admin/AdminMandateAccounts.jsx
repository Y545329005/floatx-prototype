import { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  mandateAccounts,
  mandateAgreements,
  cashLedger,
  mandateWithdrawals,
  mandateConfig,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_LEDGER_TYPES,
  MANDATE_LEDGER_LABELS,
  MANDATE_WITHDRAWAL_STATUS,
  MANDATE_WITHDRAWAL_LABELS,
  canOpenMandateAccount,
  createMandateAccount,
  reviewMandateAccountAuth,
  addMandateCashEntry,
  getMandateCashByCurrency,
  getMandateAvailableCash,
  reviewMandateWithdrawal,
  completeMandateWithdrawal,
  getInvestorUsers,
  getStandingAuthOf,
  createStandingAuth,
  revokeStandingAuth,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';
import MandateAgreementLedger from './AdminMandateAgreements';

// 委托账户（2026-11-13 批 1a · B 号账户 + 资金流水；2026-11-17 IA 收敛为「委托业务」账户签）
//
// 三条约束来自「钱与授权都不能靠 UI 守」：
//   ① 开户闸门在 data.js：协议未登记 / 未生效 / 缺 CE 号一律失败。本页只把失败原因显示出来。
//   ② 授权是 Maker-Checker：发起人与复核人不得同一人，数据层拒绝，UI 只是提前禁用。
//      2026-11-17：常驻表单卡改「状态行 + 变更授权折叠」——复核是动作不是常驻信息，
//      平时只看状态，点「变更授权」才展开表单。
//   ③ 余额不落库：列表与抽屉里的余额都由 cashLedger 现算，页面没有任何地方能改余额。
//
// 协议台账（MandateAgreementLedger）嵌在本签顶部：协议是开户流程第一步，
// 开户闸门失败时指路上方台账，不再跳独立菜单。

const STATUS_META = {
  [MANDATE_ACCOUNT_STATUS.PENDING]: { label: '待授权', cls: 'admin-status-pending' },
  [MANDATE_ACCOUNT_STATUS.ACTIVE]: { label: '已生效', cls: 'admin-status-approved' },
  [MANDATE_ACCOUNT_STATUS.SUSPENDED]: { label: '已暂停', cls: 'admin-status-pending' },
  [MANDATE_ACCOUNT_STATUS.CLOSED]: { label: '已关闭', cls: 'admin-status-closed' },
};

const INCOME_TYPES = [MANDATE_LEDGER_TYPES.DEPOSIT, MANDATE_LEDGER_TYPES.TRANSFER_IN, MANDATE_LEDGER_TYPES.DIVIDEND];
const EXPENSE_TYPES = [MANDATE_LEDGER_TYPES.TRANSFER_OUT, MANDATE_LEDGER_TYPES.WITHDRAW, MANDATE_LEDGER_TYPES.FEE];

const emptyLedgerForm = () => ({ type: MANDATE_LEDGER_TYPES.DEPOSIT, currency: 'HKD', amount: '', direction: 'in', note: '' });

const balanceLabel = (accountId) => {
  const rows = getMandateCashByCurrency(accountId);
  if (!rows.length) return '—';
  return rows.map(r => `${r.currency} ${formatExactAmount(r.balance)}`).join(' · ');
};

export default function AdminMandateAccounts({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [accountForm, setAccountForm] = useState(null);
  const [ledgerForm, setLedgerForm] = useState(emptyLedgerForm);
  const [reviewer, setReviewer] = useState('');
  const [visible, setVisible] = useState(true);
  const [authEditOpen, setAuthEditOpen] = useState(false);
  const [error, setError] = useState('');
  const [ledgerMsg, setLedgerMsg] = useState('');
  const [authForm, setAuthForm] = useState({ scope: ['transfer'], expiresAt: '', fileRef: '' });
  const [authMsg, setAuthMsg] = useState('');
  const [wdReason, setWdReason] = useState('');
  const [wdMsg, setWdMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const isNew = detailId === 'new';
  const selected = detailId && !isNew ? mandateAccounts.find(a => a.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
  const investors = useMemo(() => getInvestorUsers(), [tick]);
  const closeDrawer = () => navigate && navigate('#admin/mandate/accounts');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  useEffect(() => {
    if (isNew) {
      setAccountForm({ userId: '', agreementId: '', managerName: '', custodian: 'HighBlock Securities Limited' });
      setError('');
      return;
    }
    const acc = mandateAccounts.find(a => a.id === detailId);
    setAccountForm(acc ? { ...acc } : null);
    setLedgerForm(emptyLedgerForm());
    setReviewer('');
    setAuthEditOpen(false);
    // 待授权账户默认勾「授权显示」：复核这动作的常态就是批准可见；
    // 已生效账户默认沿用当前值，避免复核其他事项时顺手改掉可见性。
    setVisible(acc ? (acc.status === MANDATE_ACCOUNT_STATUS.PENDING ? true : !!acc.visibleInApp) : true);
    setError('');
    setLedgerMsg('');
    setWdReason('');
    setWdMsg('');
  }, [detailId]);

  const refresh = () => setTick(t => t + 1);

  // 客户可选协议：只列该客户的协议，并把不可用原因直接显示在选项后（少一次「存了才知道不行」）
  const agreementsOfUser = accountForm?.userId
    ? mandateAgreements.filter(a => a.userId === accountForm.userId)
    : [];
  const gate = isNew && accountForm?.userId && accountForm?.agreementId
    ? canOpenMandateAccount(accountForm.userId, accountForm.agreementId)
    : null;

  const handleCreate = () => {
    if (!accountForm) return;
    if (!accountForm.userId) { setError('请选择客户'); return; }
    if (!accountForm.agreementId) { setError('请选择已生效的委托协议'); return; }
    const res = createMandateAccount(accountForm, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    refresh();
    navigate(`#admin/mandate/accounts/${res.account.id}`);
  };

  const handleReview = () => {
    if (!selected) return;
    const res = reviewMandateAccountAuth(selected.id, { visibleInApp: visible, reviewer }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setAuthEditOpen(false);
    refresh();
  };

  const handleLedgerAdd = () => {
    if (!selected) return;
    const amount = Number(ledgerForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('金额需为大于 0 的数字'); return; }
    const signed = ledgerForm.direction === 'out' ? -amount : amount;
    const res = addMandateCashEntry({
      accountId: selected.id,
      type: ledgerForm.type,
      currency: ledgerForm.currency,
      amount: signed,
      note: ledgerForm.note,
      refType: 'manual',
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setLedgerMsg(`已记一笔：${MANDATE_LEDGER_LABELS[ledgerForm.type]} ${ledgerForm.currency} ${formatExactAmount(signed)}`);
    setLedgerForm(emptyLedgerForm());
    refresh();
  };

  const changeType = (type) => {
    const direction = EXPENSE_TYPES.includes(type) ? 'out' : 'in';
    setLedgerForm(prev => ({ ...prev, type, direction }));
  };

  const handleAuthAdd = () => {
    if (!selected) return;
    const res = createStandingAuth({
      accountId: selected.id,
      scope: authForm.scope,
      expiresAt: authForm.expiresAt,
      fileRef: authForm.fileRef,
    }, operator);
    if (!res.ok) { setAuthMsg(res.error); return; }
    setAuthMsg('常设授权已登记');
    setAuthForm({ scope: ['transfer'], expiresAt: '', fileRef: '' });
    refresh();
  };

  const toggleScope = (scope) => {
    setAuthForm(prev => ({
      ...prev,
      scope: prev.scope.includes(scope) ? prev.scope.filter(s => s !== scope) : [...prev.scope, scope],
    }));
  };

  const entries = selected ? cashLedger.filter(e => e.accountId === selected.id) : [];
  // 提取申请（2026-11-16 · 协议 10）：三步审核 = 通过 → （管理人变现）→ 完成登记；拒绝仅 pending
  const wdEntries = selected
    ? mandateWithdrawals.filter(w => w.accountId === selected.id)
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    : [];

  const handleWd = (id, action) => {
    const res = action === 'complete'
      ? completeMandateWithdrawal(id, operator)
      : reviewMandateWithdrawal(id, action, { reason: wdReason }, operator);
    if (!res.ok) { setWdMsg(res.error); return; }
    setWdMsg(action === 'approve' ? '已通过，待管理人变现后完成登记'
      : action === 'reject' ? '已拒绝，在途占用已释放'
      : '已登记完成：委托划出、现金账户入账');
    setWdReason('');
    refresh();
  };

  return (
    <div className="mandate-panel mandate-panel--accounts">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          {mandateAccounts.length} 个账户 · 待授权 {mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.PENDING).length} 个 ·
          待办提取 {mandateWithdrawals.filter(w => w.status === MANDATE_WITHDRAWAL_STATUS.PENDING || w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS).length} 单 ·
          余额由资金流水派生，账户不存余额
        </span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/mandate/accounts/new')}>
          <Plus size={16} /> 开立委托账户
        </button>
      </div>

      <MandateAgreementLedger admin={admin} onChanged={refresh} />

      <div className="admin-table admin-table--mandate-accounts">
        <div className="admin-table-header">
          <span className="col-name">账户号 / 客户</span>
          <span>协议</span>
          <span>基金经理</span>
          <span className="col-amount">资金余额</span>
          <span>APP 显示</span>
          <span>状态</span>
        </div>
        {mandateAccounts.map(acc => {
          const meta = STATUS_META[acc.status] || STATUS_META[MANDATE_ACCOUNT_STATUS.PENDING];
          const ag = mandateAgreements.find(a => a.id === acc.agreementId);
          return (
            <div
              key={acc.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/mandate/accounts/${acc.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/mandate/accounts/${acc.id}`); } }}
            >
              <span className="col-name">
                <strong>{acc.no}</strong>
                <span className="mandate-subline">{acc.userName || acc.userId}</span>
              </span>
              <span>{ag?.no || '—'}</span>
              <span>{acc.managerName || '—'}</span>
              <span className="col-amount">{balanceLabel(acc.id)}</span>
              <span>{acc.visibleInApp ? '显示' : '不显示'}</span>
              <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
            </div>
          );
        })}
        {mandateAccounts.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无委托账户，点击右上角开立</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && accountForm && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '开立委托账户' : `委托账户 ${accountForm.no}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '开立委托账户' : accountForm.no}
              {!isNew && selected && (
                <span className={`status-badge ${STATUS_META[selected.status]?.cls} fund-product-head-badge`}>
                  {STATUS_META[selected.status]?.label}
                </span>
              )}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {isNew ? (
              <div className="card">
                <div className="card-title">开户信息</div>
                <div className="form-group">
                  <label className="form-label">客户</label>
                  <select
                    className="form-input"
                    value={accountForm.userId}
                    onChange={e => setAccountForm(prev => ({ ...prev, userId: e.target.value, agreementId: '' }))}
                  >
                    <option value="">请选择客户</option>
                    {investors.map(u => <option key={u.userId} value={u.userId}>{u.name}（{u.investorNo || u.userId}）</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">委托协议（仅列该客户的协议）</label>
                  <select
                    className="form-input"
                    value={accountForm.agreementId}
                    onChange={e => setAccountForm(prev => ({ ...prev, agreementId: e.target.value }))}
                    disabled={!accountForm.userId}
                  >
                    <option value="">{accountForm.userId ? '请选择已生效协议' : '请先选择客户'}</option>
                    {agreementsOfUser.map(ag => (
                      <option key={ag.id} value={ag.id}>
                        {ag.no}（{ag.status === 'active' ? '生效' : ag.status === 'draft' ? '草稿' : '已终止'} · CE {ag.licensedRepCE || '缺'}）
                      </option>
                    ))}
                  </select>
                </div>
                {accountForm.userId && agreementsOfUser.length === 0 && (
                  <div className="mandate-gate-warn"><AlertTriangle size={15} /> 该客户没有登记委托协议，不能开户。请先在上方「委托协议台账」登记并生效。</div>
                )}
                {gate && !gate.ok && <div className="mandate-gate-warn"><AlertTriangle size={15} /> {gate.error}</div>}
                {gate && gate.ok && <div className="admin-form-hint">协议校验通过，可以开户。开户后为「待授权」，需合规复核后才在 APP 显示。</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">负责基金经理</label>
                    <input className="form-input" value={accountForm.managerName} onChange={e => setAccountForm(prev => ({ ...prev, managerName: e.target.value }))} placeholder="9 号牌持牌人姓名" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">托管人</label>
                    <input className="form-input" value={accountForm.custodian} onChange={e => setAccountForm(prev => ({ ...prev, custodian: e.target.value }))} />
                  </div>
                </div>
                {error && <p className="form-error">{error}</p>}
                <div className="admin-form-actions">
                  <button className="btn btn-md btn-primary" onClick={handleCreate}><Save size={16} /> 开立账户</button>
                </div>
              </div>
            ) : (
              <>
                <div className="card">
                  <div className="card-title">账户信息</div>
                  <div className="kyc-review-row"><span>客户</span><strong>{selected.userName || selected.userId}</strong></div>
                  <div className="kyc-review-row"><span>协议</span><strong>{mandateAgreements.find(a => a.id === selected.agreementId)?.no || '—'}</strong></div>
                  <div className="kyc-review-row"><span>基金经理</span><strong>{selected.managerName || '—'}</strong></div>
                  <div className="kyc-review-row"><span>托管人</span><strong>{selected.custodian || '—'}</strong></div>
                  <div className="kyc-review-row"><span>开户</span><strong>{String(selected.openedAt || '').slice(0, 16)}</strong></div>
                </div>

                <div className="card">
                  <div className="card-title"><ShieldCheck size={15} /> 授权显示（Maker-Checker）</div>
                  <div className="kyc-review-row"><span>当前状态</span><strong>{selected.visibleInApp ? '授权显示（客户可在资产页看到）' : '不显示（仅后台可见）'}</strong></div>
                  <div className="kyc-review-row"><span>发起人</span><strong>{selected.authRequestedBy || '—'}</strong></div>
                  {selected.authReviewedBy && (
                    <div className="kyc-review-row"><span>上次复核</span><strong>{selected.authReviewedBy} · {String(selected.authReviewedAt || '').slice(0, 16)}</strong></div>
                  )}
                  {!authEditOpen ? (
                    <>
                      <div className="admin-form-hint">未授权时 APP 查询层直接不返回该账户——不是把字段藏起来，客户页面上连入口都不会出现「已开通」字样之外的痕迹。变更须合规复核（复核人 ≠ 发起人）。</div>
                      <div className="admin-form-actions">
                        <button className="btn btn-md btn-outline" onClick={() => setAuthEditOpen(true)}><ShieldCheck size={16} /> 变更授权</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">复核人（不得与发起人相同）</label>
                        <input className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="合规人员姓名" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">APP 显示</label>
                        <select className="form-input" value={visible ? 'yes' : 'no'} onChange={e => setVisible(e.target.value === 'yes')}>
                          <option value="yes">授权显示（客户可在资产页看到委托账户）</option>
                          <option value="no">不显示（仅后台可见）</option>
                        </select>
                      </div>
                      {reviewer && selected.authRequestedBy === reviewer && (
                        <div className="mandate-gate-warn"><AlertTriangle size={15} /> 复核人与发起人相同，数据层会拒绝。</div>
                      )}
                      {error && <p className="form-error">{error}</p>}
                      <div className="admin-form-actions">
                        <button className="btn btn-md btn-outline" onClick={() => { setAuthEditOpen(false); setReviewer(''); setError(''); }}>取消</button>
                        <button className="btn btn-md btn-primary" onClick={handleReview}><ShieldCheck size={16} /> 提交复核</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="card">
                  <div className="card-title">常设授权（协议 14.2，与投资授权分离）</div>
                  {getStandingAuthOf(selected.id).length === 0 && <p className="text-muted text-sm">暂无有效常设授权</p>}
                  {getStandingAuthOf(selected.id).map(a => (
                    <div key={a.id} className="kyc-review-row">
                      <span>{a.scope.map(s => ({ transfer: '资金划转', repledge: '再质押', lending: '借出' }[s] || s)).join(' · ')}</span>
                      <strong>
                        至 {a.expiresAt}
                        <button className="btn-link mandate-auth-revoke" onClick={() => { revokeStandingAuth(a.id, operator); refresh(); }}>撤销</button>
                      </strong>
                    </div>
                  ))}
                  <div className="form-row mandate-auth-form">
                    <div className="form-group">
                      <label className="form-label">授权范围</label>
                      <div className="mandate-auth-scopes">
                        {[['transfer', '资金划转'], ['repledge', '再质押'], ['lending', '借出']].map(([k, label]) => (
                          <label key={k} className="mandate-auth-scope">
                            <input type="checkbox" checked={authForm.scope.includes(k)} onChange={() => toggleScope(k)} />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">到期日</label>
                      <input className="form-input" type="date" value={authForm.expiresAt} onChange={e => setAuthForm(p => ({ ...p, expiresAt: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">授权文件引用</label>
                    <input className="form-input" value={authForm.fileRef} onChange={e => setAuthForm(p => ({ ...p, fileRef: e.target.value }))} placeholder="如 常设授权书_2026-11-05.pdf" />
                  </div>
                  {authMsg && <p className="admin-form-hint">{authMsg}</p>}
                  <div className="admin-form-actions">
                    <button className="btn btn-md btn-outline" onClick={handleAuthAdd}><Plus size={16} /> 登记常设授权</button>
                  </div>
                  <div className="admin-form-hint">常设授权是资金划转与再质押的法律前提，本批只登记，不做划转动作。</div>
                </div>

                {/* 提取申请（2026-11-16 · 协议 10）：单层审核——14.2 常设授权是户级授权，
                    单次提取不再设双人复核（对齐现金提现惯例）。B→A 是平台内两户记账，无打款账户字段。 */}
                {wdEntries.length > 0 && (
                  <div className="card">
                    <div className="card-title">提取申请（协议 10 · 划入现金账户）</div>
                    {wdEntries.map(w => {
                      const wdCls = {
                        [MANDATE_WITHDRAWAL_STATUS.PENDING]: 'admin-status-pending',
                        [MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS]: 'admin-status-pending',
                        [MANDATE_WITHDRAWAL_STATUS.COMPLETED]: 'admin-status-approved',
                        [MANDATE_WITHDRAWAL_STATUS.REJECTED]: 'admin-status-closed',
                      }[w.status] || 'admin-status-pending';
                      return (
                        <div key={w.id} className="mandate-wd-row">
                          <div className="mandate-wd-main">
                            <strong>{w.currency} {formatExactAmount(w.amount)}</strong>
                            <span className="mandate-subline">{w.no} · 申请 {String(w.createdAt).slice(0, 16)}</span>
                            {(w.status === MANDATE_WITHDRAWAL_STATUS.PENDING || w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS) && w.expectedDate && (
                              <span className="mandate-subline">预计到账 {w.expectedDate}（不少于 {mandateConfig.withdrawalNoticeDays} 个营业日）</span>
                            )}
                            {w.status === MANDATE_WITHDRAWAL_STATUS.REJECTED && w.rejectReason && (
                              <span className="mandate-subline">拒绝原因：{w.rejectReason}</span>
                            )}
                          </div>
                          <div className="mandate-wd-actions">
                            <span className={`status-badge ${wdCls}`}>{MANDATE_WITHDRAWAL_LABELS[w.status] || w.status}</span>
                            {w.status === MANDATE_WITHDRAWAL_STATUS.PENDING && (
                              <>
                                <button className="btn btn-sm btn-primary" onClick={() => handleWd(w.id, 'approve')}>通过</button>
                                <button className="btn btn-sm btn-outline" onClick={() => handleWd(w.id, 'reject')}>拒绝</button>
                              </>
                            )}
                            {w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS && (
                              <button className="btn btn-sm btn-primary" onClick={() => handleWd(w.id, 'complete')}>完成登记</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {wdEntries.some(w => w.status === MANDATE_WITHDRAWAL_STATUS.PENDING) && (
                      <div className="form-group mandate-wd-reason">
                        <label className="form-label">拒绝原因（仅拒绝时填写）</label>
                        <input className="form-input" value={wdReason} onChange={e => setWdReason(e.target.value)} placeholder="如：申请金额与书面通知不符" />
                      </div>
                    )}
                    <div className="admin-form-hint">
                      通过前数据层复核余额与常设授权（协议 14.2）；「提取中」不可拒绝（管理人变现中）。
                      完成登记 = 委托划出 + 现金账户入账，平台总资金不变，不进资金审核队列。
                    </div>
                    {wdMsg && <p className="admin-form-hint">{wdMsg}</p>}
                    <div className="kyc-review-row">
                      <span>当前可提取（余额 − 在途）</span>
                      <strong>
                        {getMandateCashByCurrency(selected.id).map(r =>
                          `${r.currency} ${formatExactAmount(getMandateAvailableCash(selected.id, r.currency))}`).join(' · ') || '—'}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-title">资金流水（余额由此派生）</div>
                  <div className="kyc-review-row"><span>当前余额</span><strong>{balanceLabel(selected.id)}</strong></div>
                  <div className="admin-table admin-table--mandate-ledger">
                    <div className="admin-table-header">
                      <span>时间</span>
                      <span>类型</span>
                      <span className="col-amount">金额</span>
                      <span>备注</span>
                    </div>
                    {entries.map(e => (
                      <div key={e.id} className="admin-table-row">
                        <span>
                          {String(e.at || '').slice(0, 10)}
                          <span className="mandate-subline">{String(e.at || '').slice(11, 16)}</span>
                        </span>
                        <span>{MANDATE_LEDGER_LABELS[e.type] || e.type}</span>
                        <span className={`col-amount ${Number(e.amount) < 0 ? 'mandate-amount-out' : 'mandate-amount-in'}`}>
                          {e.currency} {Number(e.amount) > 0 ? '+' : ''}{formatExactAmount(e.amount)}
                        </span>
                        <span className="mandate-ledger-note">{e.note || '—'}</span>
                      </div>
                    ))}
                    {entries.length === 0 && (
                      <div className="admin-table-row"><span className="admin-table-empty">暂无流水</span></div>
                    )}
                  </div>

                  <div className="mandate-ledger-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">类型</label>
                        <select className="form-input" value={ledgerForm.type} onChange={e => changeType(e.target.value)}>
                          {Object.values(MANDATE_LEDGER_TYPES).map(t => (
                            <option key={t} value={t}>{MANDATE_LEDGER_LABELS[t]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">币种</label>
                        <select className="form-input" value={ledgerForm.currency} onChange={e => setLedgerForm(prev => ({ ...prev, currency: e.target.value }))}>
                          <option value="HKD">HKD</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">金额（正数）</label>
                        <input className="form-input" type="number" step="any" value={ledgerForm.amount} onChange={e => setLedgerForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="如 300000" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">方向</label>
                        <select className="form-input" value={ledgerForm.direction} onChange={e => setLedgerForm(prev => ({ ...prev, direction: e.target.value }))}>
                          <option value="in">增加余额</option>
                          <option value="out">减少余额</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">备注</label>
                      <input className="form-input" value={ledgerForm.note} onChange={e => setLedgerForm(prev => ({ ...prev, note: e.target.value }))} placeholder="如：客户银行转账入金（凭证号 …）" />
                    </div>
                    {ledgerMsg && <p className="admin-form-hint">{ledgerMsg}</p>}
                    <div className="admin-form-actions">
                      <button className="btn btn-md btn-outline" onClick={handleLedgerAdd}><Plus size={16} /> 记一笔</button>
                    </div>
                  </div>
                  <div className="admin-form-hint">
                    买入/卖出结算与费用自动入账在 1b（交易复核生效时写流水）；本轮手录用于入金、划转与费用。
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
