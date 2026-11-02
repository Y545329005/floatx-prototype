import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Download, Upload, ClipboardCheck, X, Search, ShieldCheck, FileText, Check } from 'lucide-react';
import {
  depositRequests, withdrawRequests, exchangeRequests, verificationRequests,
  approveDepositRequest, rejectDepositRequest, requestDepositEvidence,
  approveWithdrawRequest, rejectWithdrawRequest,
  approveExchangeRequest, rejectExchangeRequest,
  approveCardVerification, rejectCardVerification,
  formatExactAmount, getEvidencePreview,
} from '../mock/data';
import ImageLightbox from '../components/ImageLightbox';

const requestStatusMeta = {
  pending: { label: '待处理', cls: 'admin-status-pending' },
  requires_evidence: { label: '待补凭证', cls: 'admin-status-pending' },
  approved: { label: '已通过', cls: 'admin-status-approved' },
  rejected: { label: '已拒绝', cls: 'admin-status-rejected' },
};

// 四类单据的统一口径（列表状态名 / 抽屉标题 / 主操作文案同源，禁止各写一套）
const KIND_META = {
  deposit: { title: '充值申请', approvedLabel: '已到账', action: '确认到账' },
  withdraw: { title: '提现申请', approvedLabel: '已打款', action: '确认打款' },
  exchange: { title: '换汇申请', approvedLabel: '已完成', action: '确认换汇完成' },
  verification: { title: '白名单验证', approvedLabel: '已白名单', action: '确认到账 · 置白名单' },
};

// 审核状态筛选（B3 对齐 KYC/Exits/Subscriptions：任务优先，默认待处理 = 工作台心智）
// 2026-11-02：「待处理」= pending + requires_evidence（待补凭证也是待办，此前漏出待办面财务刷不到），
// 另设「待补凭证」独立筛选项供单独查看
// 2026-11-02 二改：「待补凭证」仅充值链路存在（requestDepositEvidence 为充值专用；提现/白名单无补传动作），
// 其余 tab 展示该筛选项 = 恒空列表（误导「单据丢失」）→ 按 tab 能力收敛，非充值 tab 只给 4 态
const REQ_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'requires_evidence', label: '待补凭证' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
];
const filtersForTab = (tabKey) => (tabKey === 'deposits' ? REQ_FILTERS : REQ_FILTERS.filter(f => f.key !== 'requires_evidence'));

// tabs（同域多类并列内容，任务优先）：充值/提现审核 + 白名单审核
// 资金流水：记录查看与审核任务分离；独立流水菜单与组件已于首期收敛摘除（AdminTransactions 文件保留待二期）
// 2026-10-29：首期不做换汇 → 从 TABS 摘除「换汇处理」，列表/抽屉配置保留在 TABLE_VARIANTS / ExchangeDrawer（二期接回只需加回这一行）
const TABS = [
  // 入金=Download（钱落进账户）、出金=Upload（钱提出去）；与 Wallet/AssetOverview 入出金方向一致（2026-10-29 对调修正）
  { key: 'deposits', label: '充值审核', icon: Download },
  { key: 'withdraws', label: '提现审核', icon: Upload },
  { key: 'verifications', label: '白名单审核', icon: ShieldCheck },
];

// ---- 列表配置：四类单据共用同一张表骨架（2026-11-02 收敛，此前四块 JSX 复制粘贴） ----
// 列宽模板见 admin.css .admin-table--{tab}（header 与 row 必须成对定义列模板，否则塌成单列）
// exchanges 当前不从 TABS 进入（休眠），配置保留：二期接回零改代码
const TABLE_VARIANTS = {
  deposits: {
    cls: 'admin-table--deposits',
    headers: [
      ['申请单号', 'col-id'], ['申请人', 'col-name'], ['金额', 'col-amount'],
      ['时间', 'col-date'], ['处理人', 'col-handler'], ['状态', 'col-status'], ['操作', 'col-actions'],
    ],
    isPending: (r) => r.status === 'pending' || r.status === 'requires_evidence',
    approvedLabel: '已到账',
    actionTitle: '审核',
    amount: (r) => `${r.currency} ${formatExactAmount(r.amount)}`,
    matchNoun: '充值申请',
    pendingNoun: '充值申请',
    emptyNoun: '充值申请',
  },
  withdraws: {
    cls: 'admin-table--withdraws',
    headers: [
      ['申请单号', 'col-id'], ['申请人', 'col-name'], ['金额', 'col-amount'],
      ['时间', 'col-date'], ['处理人', 'col-handler'], ['状态', 'col-status'], ['操作', 'col-actions'],
    ],
    isPending: (r) => r.status === 'pending',
    approvedLabel: '已打款',
    actionTitle: '审核',
    amount: (r) => `${r.currency} ${formatExactAmount(r.amount)}`,
    matchNoun: '提现申请',
    pendingNoun: '提现申请',
    emptyNoun: '提现申请',
  },
  exchanges: {
    cls: 'admin-table--exchanges',
    headers: [
      ['申请单号', 'col-id'], ['申请人', 'col-name'], ['币种对', 'col-amount'],
      ['申请时间', 'col-date'], ['处理人', 'col-handler'], ['状态', 'col-status'], ['操作', 'col-actions'],
    ],
    isPending: (r) => r.status === 'pending',
    approvedLabel: '已完成',
    actionTitle: '处理',
    amountClass: 'col-amount col-amount--stack',
    amount: (r) => (
      <>
        <span>{r.fromCurrency} {formatExactAmount(r.amount)} → {r.toCurrency}</span>
        {r.status === 'approved' && <span className="col-amount-sub">实际 {formatExactAmount(r.actualAmount)}</span>}
      </>
    ),
    matchNoun: '换汇申请',
    pendingNoun: '换汇申请',
    emptyNoun: '换汇申请',
  },
  verifications: {
    cls: 'admin-table--verifications',
    headers: [
      ['验证单号', 'col-id'], ['申请人', 'col-name'], ['验证款', 'col-amount'],
      ['申请时间', 'col-date'], ['处理人', 'col-handler'], ['状态', 'col-status'], ['操作', 'col-actions'],
    ],
    isPending: (r) => r.status === 'pending',
    approvedLabel: '已白名单',
    actionTitle: '核对',
    // 验证款 = 金额 + 卡（财务拿「这笔钱进了哪张卡」做交叉核对）；120px 单行装不下两者，
    // 复用换汇列的两行堆叠（金额主行 + 银行/尾号次级行），否则 nowrap 溢出压到申请时间列（2026-11-02 实测）
    amountClass: 'col-amount col-amount--stack',
    amount: (r) => (
      <>
        <span>{r.currency} {formatExactAmount(r.amount)}</span>
        <span className="col-amount-sub">{r.bank} {r.maskedNo}</span>
      </>
    ),
    matchNoun: '验证申请',
    pendingNoun: '白名单验证',
    emptyNoun: '验证申请',
  },
};

// 状态徽章：列表与抽屉共用（approved 文案按单据类型定制：已到账/已打款/已完成/已白名单）
function statusBadge(status, approvedLabel) {
  const meta = requestStatusMeta[status];
  const label = status === 'approved' ? approvedLabel : meta.label;
  return <span className={`status-badge ${meta.cls}`}>{label}</span>;
}

// 全宽待办列表（变体驱动：列头/金额/待办判定/空态文案来自 TABLE_VARIANTS）
function FundRequestTable({ variant, tab, rows, isSearching, reqFilter, navigate }) {
  const cfg = TABLE_VARIANTS[variant];
  const go = (id) => navigate(`#admin/funds/${tab}/${id}`);
  const emptyText = isSearching
    ? `未找到匹配的${cfg.matchNoun}`
    : reqFilter === 'pending'
      ? `暂无待处理的${cfg.pendingNoun}`
      : `暂无符合条件的${cfg.emptyNoun}`;

  return (
    <div className={`admin-table ${cfg.cls}`}>
      <div className="admin-table-header">
        {cfg.headers.map(([label, cls]) => <span key={label} className={cls}>{label}</span>)}
      </div>
      {rows.map(r => {
        const pending = cfg.isPending(r);
        return (
          <div
            key={r.id}
            className="admin-table-row"
            onClick={() => go(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(r.id); } }}
          >
            <span className="col-id">{r.orderNo}</span>
            <span className="col-name"><strong>{r.userName}</strong></span>
            <span className={cfg.amountClass || 'col-amount'}>{cfg.amount(r)}</span>
            <span className="col-date">{pending ? r.createdAt : r.handledAt}</span>
            <span className="col-handler">{pending ? '—' : r.handledBy}</span>
            <span className="col-status">{statusBadge(r.status, cfg.approvedLabel)}</span>
            <span className="col-actions">
              <button
                className="btn-icon"
                title={cfg.actionTitle}
                onClick={(e) => { e.stopPropagation(); go(r.id); }}
              >
                <ClipboardCheck size={16} />
              </button>
            </span>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="admin-table-row"><span className="admin-table-empty">{emptyText}</span></div>
      )}
    </div>
  );
}

// ---- 抽屉脚手架（2026-11-02 收敛）：三抽屉共用遮罩/Esc/滚动锁/头/底栏 + approve 失败反馈位置 ----
// 之前三套抽屉各写一遍，错误反馈位置与关闭语义随之漂移（换汇曾把 approve 失败塞进表单内）
function DrawerScaffold({ title, onClose, children, footer, approveError }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="admin-drawer-mask" onClick={onClose} />
      <div className="admin-drawer" role="dialog" aria-label={title}>
        <div className="admin-drawer-head">
          <h3 className="admin-drawer-title">{title}</h3>
          <button className="btn-icon" title="关闭" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-drawer-body">
          {children}
          {approveError && <div className="form-error">{approveError}</div>}
        </div>
        {footer && <div className="admin-drawer-actions">{footer}</div>}
      </div>
    </>
  );
}

// 拒绝/补传原因表单状态机（三抽屉共用）：空原因 = 内联报错 + 滚动定位（去 disabled 静默，对齐 KYC/Exits）
function useRejectFlow() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);
  const panelRef = useRef(null);

  const reset = () => { setOpen(false); setReason(''); setError(false); };
  const openPanel = () => { setOpen(true); setError(false); };

  const submit = (onConfirm) => {
    if (!reason.trim()) {
      setError(true);
      setTimeout(() => {
        const form = panelRef.current;
        const body = document.querySelector('.admin-drawer-body');
        if (form && body) {
          const fr = form.getBoundingClientRect();
          const br = body.getBoundingClientRect();
          body.scrollTo({ top: Math.max(0, body.scrollTop + (fr.bottom - br.bottom)), behavior: 'smooth' });
        }
      }, 60);
      return;
    }
    onConfirm(reason.trim());
  };

  return { open, reason, setReason, error, setError, reset, openPanel, submit, panelRef };
}

function RejectPanel({ flow, label, placeholder }) {
  if (!flow.open) return null;
  return (
    <div className="admin-reject-form" ref={flow.panelRef}>
      <div className="form-group">
        <label>{label}</label>
        <textarea
          className={`form-input ${flow.error ? 'field-error' : ''}`}
          rows={2}
          placeholder={placeholder}
          value={flow.reason}
          onChange={e => { flow.setReason(e.target.value); if (flow.error) flow.setError(false); }}
        />
        {flow.error && <div className="form-error">请填写原因</div>}
      </div>
    </div>
  );
}

// 状态卡（仅非 pending 渲染）：申请人/状态/留痕统一落位，审核动作结束后回看单据全貌
function StatusCard({ userName, status, approvedLabel, children }) {
  return (
    <div className="card kyc-review-block admin-fund-card">
      <div className="card-title">状态</div>
      <div className="kyc-review-row"><span>申请人</span><strong>{userName}</strong></div>
      <div className="kyc-review-row"><span>状态</span>{statusBadge(status, approvedLabel)}</div>
      {children}
    </div>
  );
}

// 资金申请详情抽屉（充值/提现共用；URL 化 #admin/funds/{tab}/{id}，2026-08-14 补 tabs 边界）
// 2026-08-19：充值抽屉增加凭证展示 + 「要求补传凭证」动作（线下充值异常处理）
function RequestDrawer({ kind, req, onClose, onApprove, onReject, onRequestEvidence }) {
  const [depositForm, setDepositForm] = useState({ actualAmount: '', bankRef: '', actualCurrency: req.currency }); // 2026-08-19：入金可改实际到账金额；2026-08-20 方案 B：不预填，按银行流水/回单手工录入（配「与登记一致」快捷按钮）；2026-10-29：币种可纠错
  const [depositFormError, setDepositFormError] = useState('');
  const [approveError, setApproveError] = useState(''); // 数据层拒绝时的反馈（2026-11-02 修复：此前失败也静默关抽屉）
  const [matchConfirmed, setMatchConfirmed] = useState(false); // 2026-08-20 方案确认：是否通过「与登记一致」一键填入（手动录入即清除，差异场景显式区分）
  const [previewOpen, setPreviewOpen] = useState(false); // 2026-08-20 凭证放大预览
  const reject = useRejectFlow();
  const meta = KIND_META[kind];
  const title = `${meta.title} #${req.id} · ${req.userName}`;

  // 2026-08-20 方案 B：打开请求时清空核销表单（不预填登记金额，避免「无脑确认」架空强制审核点；登记金额以参考行展示）
  useEffect(() => {
    if (kind === 'deposit') {
      setDepositForm({ actualAmount: '', bankRef: '', actualCurrency: req.currency });
      setDepositFormError('');
      setMatchConfirmed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, req.id]);

  const close = () => { reject.reset(); setApproveError(''); onClose(); };

  const handleReject = () => reject.submit(reason => { onReject(req.id, reason); close(); });
  const handleRequestEvidence = () => reject.submit(reason => { onRequestEvidence(req.id, reason); close(); });

  // 2026-08-20 方案 B：实际到账金额强制审核点——确认到账前财务必须显式录入实际到账金额（不预填；可点「与登记一致」快速填入，仍须主动确认）
  // 2026-11-02：数据层返回 false 时不得关抽屉假成功——如提现打款校验不过会被自动拒绝，操作者必须知情
  const handleApprove = () => {
    let ok = true;
    if (kind === 'deposit') {
      const credited = Number(depositForm.actualAmount);
      if (!Number.isFinite(credited) || credited <= 0) {
        setDepositFormError('请填写实际到账金额（必须大于 0）');
        return;
      }
      ok = onApprove(req.id, { actualAmount: String(credited), actualCurrency: depositForm.actualCurrency, bankRef: depositForm.bankRef.trim() });
    } else {
      ok = onApprove(req.id);
    }
    if (ok === false) {
      setApproveError('审核未执行：数据层校验未通过（单据可能已被自动拒绝，可在「已拒绝」筛选中查看）');
      return;
    }
    close();
  };

  // 2026-08-20 方案 B：「与登记一致」快捷按钮——核销常态（登记=到账）一键填入登记金额，仍由财务主动点确认；填入后按钮进入确认态
  const fillDeclaredAmount = () => {
    setDepositForm(f => ({ ...f, actualAmount: req.amount != null ? String(req.amount) : '' }));
    setMatchConfirmed(true);
    if (depositFormError) setDepositFormError('');
  };

  // 2026-08-20 方案确认：实际到账 ≠ 登记金额时允许确认入账（手续费/部分到账等），表单内联提示差异并留痕
  const creditedNum = Number(depositForm.actualAmount);
  const isDiffFromDeclared = depositForm.actualAmount !== '' && Number.isFinite(creditedNum) && creditedNum > 0 && creditedNum !== req.amount;

  const footer = req.status === 'pending' ? (
    reject.open ? (
      <>
        <button className="btn btn-md btn-secondary" onClick={reject.reset}>取消</button>
        {kind === 'deposit' && (
          <button className="btn btn-md btn-secondary" onClick={handleRequestEvidence}><FileText size={16} /> 要求补传凭证</button>
        )}
        <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
      </>
    ) : (
      <>
        <button className="btn btn-md btn-outline" onClick={reject.openPanel}><XCircle size={16} /> 拒绝</button>
        {kind === 'deposit' && (
          <button className="btn btn-md btn-secondary" onClick={reject.openPanel}><FileText size={16} /> 要求补传凭证</button>
        )}
        <button className="btn btn-md btn-primary" onClick={handleApprove}>
          <CheckCircle size={16} /> {meta.action}
        </button>
      </>
    )
  ) : null;

  return (
    <>
      <DrawerScaffold title={title} onClose={close} footer={footer} approveError={approveError}>
        {/* 卡序 = 申请信息（转账前快照）→ 凭证（转账后证据）→ 动作区（核销）→ 状态（仅已处理留痕）
            阅读终点 = 操作起点：滚到底时已看完所有证据，核销表单与底部「确认到账」衔接为完整操作区 */}

        {/* ① 申请信息：用户在 APP 内发起时填写/系统生成的申请快照（金额置顶强调，账户按 kind 区分付款/收款） */}
        <div className="card kyc-review-block admin-fund-card">
          <div className="card-title">申请信息</div>
          <div className="kyc-review-row"><span>金额</span><strong className="admin-fund-amount">{formatExactAmount(req.amount)}</strong></div>
          <div className="kyc-review-row"><span>币种</span><strong>{req.currency}</strong></div>
          {/* 2026-10-29：参考代码是财务把银行入账对上账户的最强键（用户已写进汇款备注），放在金额之后紧邻核销动作 */}
          {kind === 'deposit' && req.refCode && <div className="kyc-review-row"><span>参考代码</span><strong className="date-iso">{req.refCode}</strong></div>}
          {req.method && <div className="kyc-review-row"><span>通道</span><strong>{req.method}</strong></div>}
          <div className="kyc-review-row"><span>{kind === 'deposit' ? '付款银行' : '收款银行'}</span><strong>{req.bank || '—'}</strong></div>
          <div className="kyc-review-row"><span>{kind === 'deposit' ? '付款银行卡号' : '收款银行卡号'}</span><strong className="date-iso">{req.cardNo || '—'}</strong></div>
          <div className="kyc-review-row"><span>申请单号</span><strong className="date-iso">{req.orderNo}</strong></div>
          <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
          {req.transferDate && <div className="kyc-review-row"><span>用户报转账时间</span><strong>{req.transferDate}</strong></div>}
          {req.payerRef && <div className="kyc-review-row"><span>用户填回单号</span><strong className="date-iso">{req.payerRef}</strong></div>}
          {req.bankRef && <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{req.bankRef}</strong></div>}
        </div>

        {/* ② 凭证：转账动作之后的证据（用户手工上传），与转账前的申请快照分卡（仅充值） */}
        {kind === 'deposit' && (
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">凭证</div>
            {req.evidence ? (
              <div className="kyc-review-row">
                <span>转账凭证</span>
                <strong className="admin-evidence-cell">
                  <span className="admin-evidence-name"><FileText size={13} className="inline-icon" /> {req.evidence.name}</span>
                  <button className="btn btn-sm btn-outline" onClick={() => setPreviewOpen(true)}>查看凭证</button>
                </strong>
              </div>
            ) : (
              <div className="kyc-review-row"><span>转账凭证</span><strong className="text-danger">未上传</strong></div>
            )}
            {req.status === 'requires_evidence' && (
              <div className="kyc-review-row"><span>补传原因</span><strong className="text-danger">{req.requestEvidenceReason || '—'}</strong></div>
            )}
          </div>
        )}

        {/* ③ 入金核销：审核动作收尾（仅充值待处理）——信息卡全部消费完后的执行区，与底部「确认到账」衔接；登记金额参考与表单统一节奏（form-group 同构），配「与登记一致」一键确认态 + 差异提示
            2026-08-21 语义迁移：线下转账金额由「转账前申报」改为「转账后登记」（对标长桥/富途：看收款信息→自行转账→回 APP 登记转账金额+凭证），锚点=用户声明的转账金额，与凭证/银行流水三方对齐 */}
        {req.status === 'pending' && kind === 'deposit' && (
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">入金核销（请按银行实际到账核对后确认）</div>
            <div className="form-group admin-fund-ref-row">
              <label>登记金额</label>
              <div className="admin-fund-ref-value">{formatExactAmount(req.amount)}</div>
            </div>
            {/* 2026-10-29：用户可能汇错币种，银行仍可能换汇入账 → 财务按实际到账币种纠错，
                否则金额改对了、钱还是加到用户申报的那个钱包里（同一处记错两遍） */}
            <div className="form-group">
              <label>实际到账币种（默认按登记币种，银行按其他币种入账时改这里）</label>
              <select
                className="form-input"
                value={depositForm.actualCurrency}
                onChange={e => setDepositForm(f => ({ ...f, actualCurrency: e.target.value }))}
              >
                {['HKD', 'USD', 'CNH', 'CNY'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>实际到账金额（必填 · 按银行流水/回单录入）</label>
              <div className="admin-fund-amount-input">
                <input
                  className={`form-input ${depositFormError ? 'field-error' : ''} ${matchConfirmed ? 'match-ok' : ''}`}
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="按银行流水/回单输入实际到账金额"
                  value={depositForm.actualAmount}
                  onChange={e => { setDepositForm(f => ({ ...f, actualAmount: e.target.value })); setMatchConfirmed(false); if (depositFormError) setDepositFormError(''); }}
                />
                <button
                  type="button"
                  className={`btn btn-sm admin-fund-match-btn ${matchConfirmed ? 'btn-confirmed' : 'btn-secondary'}`}
                  onClick={fillDeclaredAmount}
                  disabled={matchConfirmed}
                  title="金额与登记一致时快速填入"
                >
                  {matchConfirmed ? <><Check size={14} /> 已确认一致</> : '与登记一致'}
                </button>
              </div>
              {depositFormError && <div className="form-error">{depositFormError}</div>}
              {!depositFormError && isDiffFromDeclared && (
                <div className="admin-form-hint admin-form-hint-warning">实际到账与登记金额不一致，确认后按 {formatExactAmount(creditedNum)} 记账（审计留痕差异）</div>
              )}
            </div>
            <div className="form-group">
              <label>银行入账参考号（可选）</label>
              <input
                className="form-input"
                placeholder="银行回执参考号"
                value={depositForm.bankRef}
                onChange={e => setDepositForm(f => ({ ...f, bankRef: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* ④ 状态：仅已处理时渲染（历史留痕，复核/审计依据）；pending 时删除——打开路径即「待处理」筛选、底部按钮组仅 pending 渲染、列表页状态列可见，状态 badge 三重冗余，无信息量 */}
        {req.status !== 'pending' && (
          <StatusCard userName={req.userName} status={req.status} approvedLabel={meta.approvedLabel}>
            {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
            {req.status === 'approved' && (
              <>
                {kind === 'deposit' && <div className="kyc-review-row"><span>实际到账</span><strong>{formatExactAmount(req.actualAmount ?? req.amount)}</strong></div>}
                <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>
              </>
            )}
          </StatusCard>
        )}

        <RejectPanel
          flow={reject}
          label={kind === 'deposit' ? '原因（拒绝 / 要求补传凭证）' : '拒绝原因'}
          placeholder={kind === 'deposit' ? '例如：未查询到该笔入账 / 金额或参考号不符 / 凭证模糊请补传' : '例如：收款账户信息不符 / 账户风控'}
        />
      </DrawerScaffold>
      {previewOpen && req.evidence && (
        <ImageLightbox src={getEvidencePreview(req)} title={`转账凭证 · ${req.evidence.name}`} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}

// 换汇处理抽屉（2026-08-19 人工换汇，当前休眠待二期）：财务录入银行实际成交汇率 → 确认上账
function ExchangeDrawer({ req, onClose, onApprove, onReject }) {
  const [form, setForm] = useState({ actualRate: '', bankRef: '' });
  const [formError, setFormError] = useState('');
  const [approveError, setApproveError] = useState('');
  const reject = useRejectFlow();
  const meta = KIND_META.exchange;
  const title = `${meta.title} #${req.id} · ${req.userName}`;

  const close = () => { reject.reset(); setFormError(''); setApproveError(''); onClose(); };

  const handleApprove = () => {
    const rate = parseFloat(form.actualRate);
    if (!Number.isFinite(rate) || rate <= 0) { setFormError('请填写银行实际成交汇率（大于 0）'); return; }
    // 2026-11-02：数据层 return false 时抽屉保持打开并报错（换汇 tab 休眠中，二期接回防同类坑）
    if (onApprove(req.id, { actualRate: rate, bankRef: form.bankRef.trim() }) === false) {
      setApproveError('审核未执行：数据层校验未通过（单据状态已变化，请刷新后重试）');
      return;
    }
    close();
  };

  const handleReject = () => reject.submit(reason => { onReject(req.id, reason); close(); });

  const footer = req.status === 'pending' ? (
    reject.open ? (
      <>
        <button className="btn btn-md btn-secondary" onClick={reject.reset}>取消</button>
        <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
      </>
    ) : (
      <>
        <button className="btn btn-md btn-outline" onClick={reject.openPanel}><XCircle size={16} /> 拒绝</button>
        <button className="btn btn-md btn-primary" onClick={handleApprove}><CheckCircle size={16} /> {meta.action}</button>
      </>
    )
  ) : null;

  return (
    <DrawerScaffold title={title} onClose={close} footer={footer} approveError={approveError}>
      <div className="card kyc-review-block admin-fund-card">
        <div className="card-title">资金</div>
        <div className="kyc-review-row"><span>币种对</span><strong>{req.fromCurrency} → {req.toCurrency}</strong></div>
        <div className="kyc-review-row"><span>卖出金额</span><strong className="admin-fund-amount">{req.fromCurrency} {formatExactAmount(req.amount)}</strong></div>
        <div className="kyc-review-row"><span>参考汇率</span><strong>1 {req.fromCurrency} = {req.refRate} {req.toCurrency}</strong></div>
        <div className="kyc-review-row"><span>估算到账</span><strong>{req.toCurrency} {formatExactAmount(req.expectedAmount)}</strong></div>
      </div>
      <div className="card kyc-review-block admin-fund-card">
        <div className="card-title">单据</div>
        <div className="kyc-review-row"><span>申请单号</span><strong className="date-iso">{req.orderNo}</strong></div>
        {req.bankRef && <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{req.bankRef}</strong></div>}
        <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
      </div>
      {req.status === 'pending' && (
        <div className="card kyc-review-block admin-fund-card">
          <div className="card-title">银行换汇结果录入</div>
          <div className="form-group">
            <label>实际成交汇率（1 {req.fromCurrency} = ? {req.toCurrency}）</label>
            <input
              className="form-input"
              type="number"
              step="any"
              placeholder={`银行实际成交汇率，如 ${req.refRate}`}
              value={form.actualRate}
              onChange={e => { setForm(f => ({ ...f, actualRate: e.target.value })); setFormError(''); }}
            />
          </div>
          <div className="form-group">
            <label>银行换汇参考号（可选）</label>
            <input
              className="form-input"
              placeholder="银行回执参考号"
              value={form.bankRef}
              onChange={e => setForm(f => ({ ...f, bankRef: e.target.value }))}
            />
          </div>
          {formError && <div className="form-error">{formError}</div>}
        </div>
      )}
      {req.status !== 'pending' && (
        <StatusCard userName={req.userName} status={req.status} approvedLabel={meta.approvedLabel}>
          {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
          {req.status === 'approved' && (
            <>
              <div className="kyc-review-row"><span>实际成交汇率</span><strong>{req.actualRate}</strong></div>
              <div className="kyc-review-row"><span>实际到账</span><strong>{req.toCurrency} {formatExactAmount(req.actualAmount)}</strong></div>
              <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>
            </>
          )}
        </StatusCard>
      )}
      <RejectPanel flow={reject} label="拒绝原因" placeholder="例如：银行换汇失败 / 汇率不利客户暂缓" />
    </DrawerScaffold>
  );
}

// 白名单审核抽屉（2026-08-19）：财务核对验证款到账 → 卡片置白名单 + 验证款计入余额
// 2026-11-02：批准不再无条件关抽屉——数据层 return false（如单据/卡片状态已变）时抽屉保持打开并报错，
// 与 RequestDrawer 的 handleApprove 同口径（此前 vr1 种子缺 bc9 时曾长期「假成功」静默丢失）
function VerificationDrawer({ req, onClose, onApprove, onReject }) {
  const [approveError, setApproveError] = useState('');
  const reject = useRejectFlow();
  const meta = KIND_META.verification;
  const title = `${meta.title} #${req.id} · ${req.userName}`;

  const close = () => { reject.reset(); setApproveError(''); onClose(); };

  // 2026-11-02：数据层 return false 时抽屉保持打开并报错（此前无条件 close = 假成功）
  const handleApprove = () => {
    if (onApprove(req.id) === false) {
      setApproveError('审核未执行：数据层校验未通过（单据或卡片状态已变化，请刷新后重试）');
      return;
    }
    close();
  };

  const handleReject = () => reject.submit(reason => { onReject(req.id, reason); close(); });

  const footer = req.status === 'pending' ? (
    reject.open ? (
      <>
        <button className="btn btn-md btn-secondary" onClick={reject.reset}>取消</button>
        <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
      </>
    ) : (
      <>
        <button className="btn btn-md btn-outline" onClick={reject.openPanel}><XCircle size={16} /> 拒绝</button>
        <button className="btn btn-md btn-primary" onClick={handleApprove}>
          <CheckCircle size={16} /> {meta.action}
        </button>
      </>
    )
  ) : null;

  return (
    <DrawerScaffold title={title} onClose={close} footer={footer} approveError={approveError}>
      <div className="card kyc-review-block admin-fund-card">
        <div className="card-title">验证款</div>
        <div className="kyc-review-row"><span>币种</span><strong>{req.currency}</strong></div>
        <div className="kyc-review-row"><span>金额</span><strong className="admin-fund-amount">{formatExactAmount(req.amount)}</strong></div>
        <div className="kyc-review-row"><span>转账附言</span><strong>{req.remark || '—'}</strong></div>
      </div>
      <div className="card kyc-review-block admin-fund-card">
        <div className="card-title">银行卡</div>
        <div className="kyc-review-row"><span>银行</span><strong>{req.bank || '—'}</strong></div>
        <div className="kyc-review-row"><span>卡号</span><strong className="date-iso">{req.maskedNo || '—'}</strong></div>
      </div>
      <div className="card kyc-review-block admin-fund-card">
        <div className="card-title">单据</div>
        <div className="kyc-review-row"><span>验证单号</span><strong className="date-iso">{req.orderNo}</strong></div>
        {req.bankRef && <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{req.bankRef}</strong></div>}
        <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
      </div>
      {req.status !== 'pending' && (
        <StatusCard userName={req.userName} status={req.status} approvedLabel={meta.approvedLabel}>
          {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
          {req.status === 'approved' && <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>}
        </StatusCard>
      )}
      <p className="text-muted text-sm admin-fund-hint">核对到账后卡片置白名单，验证款计入用户可用余额。</p>
      <RejectPanel flow={reject} label="拒绝原因" placeholder="例如：未查询到验证款到账 / 附言与卡号不符" />
    </DrawerScaffold>
  );
}

export default function AdminFunds({ navigate, tab, detailId, admin }) {
  const [reqFilter, setReqFilter] = useState('pending'); // 状态筛选（默认待处理 = 任务优先）
  const [keyword, setKeyword] = useState('');            // 审核搜索（单号/申请人/金额，跨 filter 全局检索——对齐 KYC/Users）

  // tab 由 URL param2 驱动（#admin/funds/{tab}），默认 'deposits'（任务优先）；刷新/分享保留
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'deposits';
  const goTab = (key) => { if (navigate) navigate(`#admin/funds/${key}`); };
  // 筛选能力按 tab 收敛：「待补凭证」只在充值存在；历史筛选态不属于当前 tab 时回落「待处理」
  // （浏览器 back/forward 切 tab 也走此兜底，避免按钮不可见却过滤生效成空列表）
  const filterOptions = filtersForTab(activeTab);
  const effectiveFilter = filterOptions.some(f => f.key === reqFilter) ? reqFilter : 'pending';

  // 状态归一：切到不提供当前筛选项的 tab（按钮/前进后退/深链）时把选择落回「待处理」，
  // 否则下次切回充值 tab 会突然回到「待补凭证」，与中间 tab 的可见态不一致
  useEffect(() => {
    if (!filtersForTab(activeTab).some(f => f.key === reqFilter)) setReqFilter('pending');
  }, [activeTab, reqFilter]);

  // 抽屉由 URL param3 驱动（#admin/funds/{tab}/{id}）
  const selId = detailId || null;
  const selDep = activeTab === 'deposits' && selId ? depositRequests.find(r => r.id === selId) : null;
  const selWit = activeTab === 'withdraws' && selId ? withdrawRequests.find(r => r.id === selId) : null;
  const selExc = activeTab === 'exchanges' && selId ? exchangeRequests.find(r => r.id === selId) : null;
  const selVer = activeTab === 'verifications' && selId ? verificationRequests.find(r => r.id === selId) : null;
  const goList = () => { if (navigate) navigate(`#admin/funds/${activeTab}`); };
  const operator = admin?.name || '运营后台';

  // 待处理盘口（任务优先摘要）：充值含 requires_evidence（2026-11-02 待补凭证计入待办）
  const pendingDeposits = depositRequests.filter(r => r.status === 'pending' || r.status === 'requires_evidence');
  const pendingWithdraws = withdrawRequests.filter(r => r.status === 'pending');
  const pendingVerifications = verificationRequests.filter(r => r.status === 'pending');

  // 审核搜索（单号/申请人/金额原文匹配）+ 状态筛选：
  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const searchMatch = (r) =>
    (r.orderNo || '').toLowerCase().includes(kw)
    || (r.userName || '').toLowerCase().includes(kw)
    || String(r.amount || r.expectedAmount || '').includes(kw);
  const filterReqs = (arr) => {
    if (isSearching) return arr.filter(searchMatch);
    if (effectiveFilter === 'all') return arr;
    if (effectiveFilter === 'approved') return arr.filter(r => r.status === 'approved');
    if (effectiveFilter === 'rejected') return arr.filter(r => r.status === 'rejected');
    if (effectiveFilter === 'requires_evidence') return arr.filter(r => r.status === 'requires_evidence');
    return arr.filter(r => r.status === 'pending' || r.status === 'requires_evidence');
  };
  // 四类单据同一筛选口径；exchanges 当前不由 TABS 进入（休眠配置）
  const shownRequests = {
    deposits: filterReqs(depositRequests),
    withdraws: filterReqs(withdrawRequests),
    exchanges: filterReqs(exchangeRequests),
    verifications: filterReqs(verificationRequests),
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>资金审核</h1>
        <span className="text-muted">待处理：充值 {pendingDeposits.length} · 提现 {pendingWithdraws.length} · 白名单 {pendingVerifications.length}</span>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => goTab(t.key)}
          >
            <t.icon size={15} /> {t.label}
            {(t.key === 'deposits' && pendingDeposits.length > 0) && ` (${pendingDeposits.length})`}
            {(t.key === 'withdraws' && pendingWithdraws.length > 0) && ` (${pendingWithdraws.length})`}
            {(t.key === 'verifications' && pendingVerifications.length > 0) && ` (${pendingVerifications.length})`}
          </button>
        ))}
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {filterOptions.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${effectiveFilter === f.key && !isSearching ? 'active' : ''}`}
              onClick={() => setReqFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={14} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="按单号 / 申请人 / 金额搜索"
            placeholder="按单号 / 申请人 / 金额搜索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {keyword && (
            <button className="btn-icon" title="清除搜索" onClick={() => setKeyword('')}><X size={14} /></button>
          )}
        </div>
      </div>

      {/* 任务优先 tab：当前类别一张全宽待办列表（列头/空态/状态名由变体配置驱动） */}
      <FundRequestTable
        variant={activeTab}
        tab={activeTab}
        rows={shownRequests[activeTab]}
        isSearching={isSearching}
        reqFilter={effectiveFilter}
        navigate={navigate}
      />

      {/* 统一右侧抽屉：资金申请详情 + 审核操作（URL 化驱动） */}
      {selDep && (
        <RequestDrawer
          kind="deposit"
          req={selDep}
          onClose={goList}
          onApprove={(id, opts) => approveDepositRequest(id, opts, operator)}
          onReject={(id, reason) => rejectDepositRequest(id, reason, operator)}
          onRequestEvidence={(id, reason) => requestDepositEvidence(id, reason, operator)}
        />
      )}
      {selWit && (
        <RequestDrawer
          kind="withdraw"
          req={selWit}
          onClose={goList}
          onApprove={(id) => approveWithdrawRequest(id, operator)}
          onReject={(id, reason) => rejectWithdrawRequest(id, reason, operator)}
        />
      )}
      {selExc && (
        <ExchangeDrawer
          req={selExc}
          onClose={goList}
          onApprove={(id, { actualRate, bankRef }) => approveExchangeRequest(id, { actualRate, bankRef }, operator)}
          onReject={(id, reason) => rejectExchangeRequest(id, reason, operator)}
        />
      )}
      {selVer && (
        <VerificationDrawer
          req={selVer}
          onClose={goList}
          onApprove={(id) => approveCardVerification(id, operator)}
          onReject={(id, reason) => rejectCardVerification(id, reason, operator)}
        />
      )}
    </div>
  );
}
