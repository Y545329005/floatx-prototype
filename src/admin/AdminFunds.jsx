import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Download, Upload, ClipboardCheck, X, Search, ArrowRightLeft, ShieldCheck, FileText, Check } from 'lucide-react';
import {
  depositRequests, withdrawRequests, exchangeRequests, verificationRequests, subscriptions,
  approveDepositRequest, rejectDepositRequest, requestDepositEvidence,
  approveWithdrawRequest, rejectWithdrawRequest,
  approveExchangeRequest, rejectExchangeRequest,
  approveCardVerification, rejectCardVerification,
  formatCurrency, formatExactAmount, getEvidencePreview,
} from '../mock/data';
import ImageLightbox from '../components/ImageLightbox';

const requestStatusMeta = {
  pending: { label: '待处理', cls: 'admin-status-pending' },
  requires_evidence: { label: '待补凭证', cls: 'admin-status-pending' },
  approved: { label: '已通过', cls: 'admin-status-approved' },
  rejected: { label: '已拒绝', cls: 'admin-status-rejected' },
};

// 审核状态筛选（B3 对齐 KYC/Exits/Subscriptions：全部/待处理/已处理完——任务优先，默认待处理 = 工作台心智）
const REQ_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
];

// tabs（2026-08-19 扩充为 4 tab）：充值/提现审核 + 换汇处理 + 银行卡白名单审核（同域多类并列内容）
// 资金流水 2026-08-14 拆独立菜单（#admin/transactions，AdminTransactions 组件）——记录查看与审核任务分离
const TABS = [
  { key: 'deposits', label: '充值审核', icon: Upload },
  { key: 'withdraws', label: '提现审核', icon: Download },
  { key: 'exchanges', label: '换汇处理', icon: ArrowRightLeft },
  { key: 'verifications', label: '白名单审核', icon: ShieldCheck },
];

// 资金申请详情抽屉（充值/提现共用；URL 化 #admin/funds/{tab}/{id}，2026-08-14 补 tabs 边界）
// 2026-08-19：充值抽屉增加凭证展示 + 「要求补传凭证」动作（线下充值异常处理）
function RequestDrawer({ kind, req, onClose, onApprove, onReject, onRequestEvidence }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [depositForm, setDepositForm] = useState({ actualAmount: '', bankRef: '' }); // 2026-08-19：入金可改实际到账金额；2026-08-20 方案 B：不预填，按银行流水/回单手工录入（配「与登记一致」快捷按钮）
  const [depositFormError, setDepositFormError] = useState('');
  const [matchConfirmed, setMatchConfirmed] = useState(false); // 2026-08-20 方案确认：是否通过「与登记一致」一键填入（手动录入即清除，差异场景显式区分）
  const [previewOpen, setPreviewOpen] = useState(false); // 2026-08-20 凭证放大预览
  const reasonFormRef = useRef(null);
  const meta = requestStatusMeta[req.status];
  const title = `${kind === 'deposit' ? '充值' : '提现'}申请 #${req.id} · ${req.userName}`;

  // 2026-08-20 方案 B：打开请求时清空核销表单（不预填登记金额，避免「无脑确认」架空强制审核点；登记金额以参考行展示）
  useEffect(() => {
    if (kind === 'deposit') {
      setDepositForm({ actualAmount: '', bankRef: '' });
      setDepositFormError('');
      setMatchConfirmed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, req.id]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { setRejectOpen(false); setReason(''); setReasonError(false); onClose(); };

  const scrollToReason = () => {
    setReasonError(true);
    setTimeout(() => {
      const form = reasonFormRef.current;
      const body = document.querySelector('.admin-drawer-body');
      if (form && body) {
        const fr = form.getBoundingClientRect();
        const br = body.getBoundingClientRect();
        body.scrollTo({ top: Math.max(0, body.scrollTop + (fr.bottom - br.bottom)), behavior: 'smooth' });
      }
    }, 60);
  };

  const handleReject = () => {
    if (!reason.trim()) return scrollToReason();
    onReject(req.id, reason.trim());
    close();
  };

  const handleRequestEvidence = () => {
    if (!reason.trim()) return scrollToReason();
    onRequestEvidence(req.id, reason.trim());
    close();
  };

  // 2026-08-20 方案 B：实际到账金额强制审核点——确认到账前财务必须显式录入实际到账金额（不预填；可点「与登记一致」快速填入，仍须主动确认）
  const handleApprove = () => {
    if (kind === 'deposit') {
      const credited = Number(depositForm.actualAmount);
      if (!Number.isFinite(credited) || credited <= 0) {
        setDepositFormError('请填写实际到账金额（必须大于 0）');
        return;
      }
      onApprove(req.id, { actualAmount: String(credited), bankRef: depositForm.bankRef.trim() });
    } else {
      onApprove(req.id);
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

  return (
    <>
      <div className="admin-drawer-mask" onClick={close} />
      <div className="admin-drawer" role="dialog" aria-label={title}>
        <div className="admin-drawer-head">
          <h3 className="admin-drawer-title">{title}</h3>
          <button className="btn-icon" title="关闭" onClick={close}><X size={18} /></button>
        </div>
        <div className="admin-drawer-body">
          {/* 2026-08-21 方案确认：信息区在上、操作区收尾——申请信息(转账前·APP 填写的申请快照) → 凭证(转账后·手工上传的事后证据) → 入金核销(审核动作) → [状态(仅已处理·留痕)]
              分组维度=信息来源与时间轴（申请快照 vs 事后证据），非数据库视角的「资金/单据/账户」三类拆分——三卡每卡 2-3 行是视觉噪音；
              阅读终点 = 操作起点：滚到底时已看完所有证据，核销表单与底部「确认到账」衔接为完整操作区；
              pending 时状态卡不渲染：状态=打开路径前提 + 按钮组隐含 + 列表列可见，三重冗余零信息量 */}

          {/* ① 申请信息：用户在 APP 内发起时填写/系统生成的申请快照（金额置顶强调，账户按 kind 区分付款/收款） */}
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">申请信息</div>
            <div className="kyc-review-row"><span>金额</span><strong className="admin-fund-amount">{formatExactAmount(req.amount)}</strong></div>
            <div className="kyc-review-row"><span>币种</span><strong>{req.currency}</strong></div>
            {req.method && <div className="kyc-review-row"><span>通道</span><strong>{req.method}</strong></div>}
            <div className="kyc-review-row"><span>{kind === 'deposit' ? '付款银行' : '收款银行'}</span><strong>{req.bank || '—'}</strong></div>
            <div className="kyc-review-row"><span>{kind === 'deposit' ? '付款银行卡号' : '收款银行卡号'}</span><strong className="date-iso">{req.cardNo || '—'}</strong></div>
            <div className="kyc-review-row"><span>申请单号</span><strong className="date-iso">{req.orderNo}</strong></div>
            <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
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
                <div className="kyc-review-row"><span>转账凭证</span><strong className="text-danger">未上传 / eDDA 通道</strong></div>
              )}
              {req.status === 'requires_evidence' && (
                <div className="kyc-review-row"><span>补传原因</span><strong className="text-danger">{req.requestEvidenceReason || '—'}</strong></div>
              )}
            </div>
          )}

          {/* ③ 状态：仅已处理时渲染（历史留痕，复核/审计依据）；pending 时删除——打开路径即「待处理」筛选、底部按钮组仅 pending 渲染、列表页状态列可见，状态 badge 三重冗余，无信息量 */}
          {req.status !== 'pending' && (
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">状态</div>
              <div className="kyc-review-row"><span>申请人</span><strong>{req.userName}</strong></div>
              <div className="kyc-review-row"><span>状态</span>
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
              </div>
              {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
              {req.status === 'approved' && (
                <>
                  {kind === 'deposit' && <div className="kyc-review-row"><span>实际到账</span><strong>{formatExactAmount(req.actualAmount ?? req.amount)}</strong></div>}
                  <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>
                </>
              )}
            </div>
          )}

          {/* ④ 入金核销：审核动作收尾（仅充值待处理）——信息卡全部消费完后的执行区，与底部「确认到账」衔接；登记金额参考与表单统一节奏（form-group 同构），配「与登记一致」一键确认态 + 差异提示
              2026-08-21 语义迁移：线下转账金额由「转账前申报」改为「转账后登记」（对标长桥/富途：看收款信息→自行转账→回 APP 登记转账金额+凭证），锚点=用户声明的转账金额，与凭证/银行流水三方对齐 */}
          {req.status === 'pending' && kind === 'deposit' && (
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">入金核销（请按银行实际到账核对后确认）</div>
              <div className="form-group admin-fund-ref-row">
                <label>登记金额</label>
                <div className="admin-fund-ref-value">{formatExactAmount(req.amount)}</div>
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

          {req.status === 'pending' && rejectOpen && (
            <div className="admin-reject-form" ref={reasonFormRef}>
              <div className="form-group">
                <label>{kind === 'deposit' ? '原因（拒绝 / 要求补传凭证）' : '拒绝原因'}</label>
                <textarea
                  className={`form-input ${reasonError ? 'field-error' : ''}`}
                  rows={2}
                  placeholder={kind === 'deposit' ? '例如：未查询到该笔入账 / 金额或参考号不符 / 凭证模糊请补传' : '例如：收款账户信息不符 / 账户风控'}
                  value={reason}
                  onChange={e => { setReason(e.target.value); if (reasonError) setReasonError(false); }}
                />
                {reasonError && <div className="form-error">请填写原因</div>}
              </div>
            </div>
          )}
        </div>
        {req.status === 'pending' && (
          <div className="admin-drawer-actions">
            {rejectOpen ? (
              <>
                <button className="btn btn-md btn-secondary" onClick={() => { setRejectOpen(false); setReason(''); setReasonError(false); }}>取消</button>
                {kind === 'deposit' && (
                  <button className="btn btn-md btn-secondary" onClick={handleRequestEvidence}><FileText size={16} /> 要求补传凭证</button>
                )}
                <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
              </>
            ) : (
              <>
                <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 拒绝</button>
                {kind === 'deposit' && (
                  <button className="btn btn-md btn-secondary" onClick={() => setRejectOpen(true)}><FileText size={16} /> 要求补传凭证</button>
                )}
                <button className="btn btn-md btn-primary" onClick={handleApprove}>
                  <CheckCircle size={16} /> {kind === 'deposit' ? '确认到账' : '确认打款'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {previewOpen && req.evidence && (
        <ImageLightbox src={getEvidencePreview(req)} title={`转账凭证 · ${req.evidence.name}`} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}

// 换汇处理抽屉（2026-08-19 人工换汇）：财务录入银行实际成交汇率 → 确认上账
function ExchangeDrawer({ req, onClose, onApprove, onReject }) {
  const [form, setForm] = useState({ actualRate: '', bankRef: '' });
  const [formError, setFormError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const meta = requestStatusMeta[req.status];
  const title = `换汇申请 #${req.id} · ${req.userName}`;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { setRejectOpen(false); setReason(''); setFormError(''); onClose(); };

  const handleApprove = () => {
    const rate = parseFloat(form.actualRate);
    if (!Number.isFinite(rate) || rate <= 0) { setFormError('请填写银行实际成交汇率（大于 0）'); return; }
    onApprove(req.id, { actualRate: rate, bankRef: form.bankRef.trim() });
    close();
  };

  const handleReject = () => {
    if (!reason.trim()) { setFormError('请填写拒绝原因'); return; }
    onReject(req.id, reason.trim());
    close();
  };

  return (
    <>
      <div className="admin-drawer-mask" onClick={close} />
      <div className="admin-drawer" role="dialog" aria-label={title}>
        <div className="admin-drawer-head">
          <h3 className="admin-drawer-title">{title}</h3>
          <button className="btn-icon" title="关闭" onClick={close}><X size={18} /></button>
        </div>
        <div className="admin-drawer-body">
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
          </div>
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">状态</div>
            <div className="kyc-review-row"><span>申请人</span><strong>{req.userName}</strong></div>
            <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
            <div className="kyc-review-row"><span>状态</span>
              <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
            </div>
            {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
            {req.status === 'approved' && (
              <>
                <div className="kyc-review-row"><span>实际成交汇率</span><strong>{req.actualRate}</strong></div>
                <div className="kyc-review-row"><span>实际到账</span><strong>{req.toCurrency} {formatExactAmount(req.actualAmount)}</strong></div>
                <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>
              </>
            )}
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
          {req.status === 'pending' && rejectOpen && (
            <div className="admin-reject-form">
              <div className="form-group">
                <label>拒绝原因</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="例如：银行换汇失败 / 汇率不利客户暂缓"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setFormError(''); }}
                />
              </div>
            </div>
          )}
        </div>
        {req.status === 'pending' && (
          <div className="admin-drawer-actions">
            {rejectOpen ? (
              <>
                <button className="btn btn-md btn-secondary" onClick={() => { setRejectOpen(false); setReason(''); setFormError(''); }}>取消</button>
                <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
              </>
            ) : (
              <>
                <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 拒绝</button>
                <button className="btn btn-md btn-primary" onClick={handleApprove}><CheckCircle size={16} /> 确认换汇完成</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// 白名单审核抽屉（2026-08-19）：财务核对验证款到账 → 卡片置白名单 + 验证款计入余额
function VerificationDrawer({ req, onClose, onApprove, onReject }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const meta = requestStatusMeta[req.status];
  const title = `白名单验证 #${req.id} · ${req.userName}`;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { setRejectOpen(false); setReason(''); setFormError(''); onClose(); };

  const handleReject = () => {
    if (!reason.trim()) { setFormError('请填写拒绝原因'); return; }
    onReject(req.id, reason.trim());
    close();
  };

  return (
    <>
      <div className="admin-drawer-mask" onClick={close} />
      <div className="admin-drawer" role="dialog" aria-label={title}>
        <div className="admin-drawer-head">
          <h3 className="admin-drawer-title">{title}</h3>
          <button className="btn-icon" title="关闭" onClick={close}><X size={18} /></button>
        </div>
        <div className="admin-drawer-body">
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
            <div className="kyc-review-row"><span>申请人</span><strong>{req.userName}</strong></div>
          </div>
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">单据</div>
            <div className="kyc-review-row"><span>验证单号</span><strong className="date-iso">{req.orderNo}</strong></div>
            {req.bankRef && <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{req.bankRef}</strong></div>}
            <div className="kyc-review-row"><span>申请时间</span><strong>{req.createdAt}</strong></div>
          </div>
          <div className="card kyc-review-block admin-fund-card">
            <div className="card-title">状态</div>
            <div className="kyc-review-row"><span>状态</span>
              <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
            </div>
            {req.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{req.rejectReason}</strong></div>}
            {req.status === 'approved' && <div className="kyc-review-row"><span>处理时间</span><strong>{req.handledAt} · {req.handledBy}</strong></div>}
          </div>
          <p className="text-muted text-sm admin-fund-hint">核对到账后卡片置白名单，验证款计入用户可用余额。</p>
          {req.status === 'pending' && rejectOpen && (
            <div className="admin-reject-form">
              <div className="form-group">
                <label>拒绝原因</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="例如：未查询到验证款到账 / 附言与卡号不符"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setFormError(''); }}
                />
              </div>
            </div>
          )}
        </div>
        {req.status === 'pending' && (
          <div className="admin-drawer-actions">
            {rejectOpen ? (
              <>
                <button className="btn btn-md btn-secondary" onClick={() => { setRejectOpen(false); setReason(''); setFormError(''); }}>取消</button>
                <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
              </>
            ) : (
              <>
                <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 拒绝</button>
                <button className="btn btn-md btn-primary" onClick={() => { onApprove(req.id); close(); }}>
                  <CheckCircle size={16} /> 确认到账 · 置白名单
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function statusBadge(status, approvedLabel) {
  const meta = requestStatusMeta[status];
  const label = status === 'approved' ? approvedLabel : status === 'rejected' ? '已拒绝' : status === 'requires_evidence' ? '待补凭证' : '待处理';
  return <span className={`status-badge ${meta.cls}`}>{label}</span>;
}

export default function AdminFunds({ navigate, tab, detailId, admin }) {
  const [reqFilter, setReqFilter] = useState('pending'); // 状态筛选（默认待处理 = 任务优先）
  const [keyword, setKeyword] = useState('');            // 审核搜索（单号/申请人/金额，跨 filter 全局检索——对齐 KYC/Users）

  // tab 由 URL param2 驱动（#admin/funds/{tab}），默认 'deposits'（任务优先）；刷新/分享保留
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'deposits';
  const goTab = (key) => { if (navigate) navigate(`#admin/funds/${key}`); };

  // 抽屉由 URL param3 驱动（#admin/funds/{tab}/{id}）
  const selId = detailId || null;
  const selDep = activeTab === 'deposits' && selId ? depositRequests.find(r => r.id === selId) : null;
  const selWit = activeTab === 'withdraws' && selId ? withdrawRequests.find(r => r.id === selId) : null;
  const selExc = activeTab === 'exchanges' && selId ? exchangeRequests.find(r => r.id === selId) : null;
  const selVer = activeTab === 'verifications' && selId ? verificationRequests.find(r => r.id === selId) : null;
  const goList = () => { if (navigate) navigate(`#admin/funds/${activeTab}`); };
  const operator = admin?.name || '运营后台';

  // 待处理盘口（任务优先摘要）
  const pendingDeposits = depositRequests.filter(r => r.status === 'pending');
  const pendingWithdraws = withdrawRequests.filter(r => r.status === 'pending');
  const pendingExchanges = exchangeRequests.filter(r => r.status === 'pending');
  const pendingVerifications = verificationRequests.filter(r => r.status === 'pending');
  // 平台级冻结（2026-08-14 修正：后台资金运营看平台汇总，非单用户钱包 wallet.hkd.frozen）：
  // = 全部申购 allocated 的 frozenAmount 汇总（与 Dashboard 口径一致）；冻结明细操作在申购记录页，本页仅盘口展示
  const platformFrozen = subscriptions
    .filter(s => s.status === 'allocated' && (s.frozenAmount || 0) > 0)
    .reduce((acc, s) => acc + (s.frozenAmount || 0), 0);

  // 审核搜索（单号/申请人/金额原文匹配）+ 状态筛选：
  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const searchMatch = (r) =>
    (r.orderNo || '').toLowerCase().includes(kw)
    || (r.userName || '').toLowerCase().includes(kw)
    || String(r.amount || r.expectedAmount || '').includes(kw);
  const filterReqs = (arr) => {
    if (isSearching) return arr.filter(searchMatch);
    if (reqFilter === 'all') return arr;
    if (reqFilter === 'approved') return arr.filter(r => r.status === 'approved');
    if (reqFilter === 'rejected') return arr.filter(r => r.status === 'rejected');
    return arr.filter(r => r.status === 'pending');
  };
  const shownDeposits = filterReqs(depositRequests);
  const shownWithdraws = filterReqs(withdrawRequests);
  const shownExchanges = filterReqs(exchangeRequests);
  const shownVerifications = filterReqs(verificationRequests);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>资金审核</h1>
        <span className="text-muted">待处理：充值 {pendingDeposits.length} · 提现 {pendingWithdraws.length} · 换汇 {pendingExchanges.length} · 白名单 {pendingVerifications.length} · 冻结 HK$ {formatCurrency(platformFrozen)}</span>
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
            {(t.key === 'exchanges' && pendingExchanges.length > 0) && ` (${pendingExchanges.length})`}
            {(t.key === 'verifications' && pendingVerifications.length > 0) && ` (${pendingVerifications.length})`}
          </button>
        ))}
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {REQ_FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${reqFilter === f.key && !isSearching ? 'active' : ''}`}
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

      {/* 充值审核（任务优先 tab 1）：全宽待办列表 + filter-row + 搜索 + 操作列 + 抽屉 */}
      {activeTab === 'deposits' && (
        <div className="admin-table admin-table--deposits">
          <div className="admin-table-header">
            <span className="col-id">申请单号</span>
            <span className="col-name">申请人</span>
            <span className="col-amount">金额</span>
            <span className="col-date">时间</span>
            <span className="col-handler">处理人</span>
            <span className="col-status">状态</span>
            <span className="col-actions">操作</span>
          </div>
          {shownDeposits.map(r => (
            <div
              key={r.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/funds/deposits/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/funds/deposits/${r.id}`); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name"><strong>{r.userName}</strong></span>
              <span className="col-amount">{r.currency} {formatExactAmount(r.amount)}</span>
              <span className="col-date">{r.status === 'pending' || r.status === 'requires_evidence' ? r.createdAt : r.handledAt}</span>
              <span className="col-handler">{r.status === 'pending' || r.status === 'requires_evidence' ? '—' : r.handledBy}</span>
              <span className="col-status">{statusBadge(r.status, '已到账')}</span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="审核"
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/funds/deposits/${r.id}`); }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          ))}
          {shownDeposits.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">
              {isSearching ? '未找到匹配的充值申请' : reqFilter === 'pending' ? '暂无待处理的充值申请' : '暂无符合条件的充值申请'}
            </span></div>
          )}
        </div>
      )}

      {/* 提现审核（任务优先 tab 2） */}
      {activeTab === 'withdraws' && (
        <div className="admin-table admin-table--withdraws">
          <div className="admin-table-header">
            <span className="col-id">申请单号</span>
            <span className="col-name">申请人</span>
            <span className="col-amount">金额</span>
            <span className="col-date">时间</span>
            <span className="col-handler">处理人</span>
            <span className="col-status">状态</span>
            <span className="col-actions">操作</span>
          </div>
          {shownWithdraws.map(r => (
            <div
              key={r.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/funds/withdraws/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/funds/withdraws/${r.id}`); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name"><strong>{r.userName}</strong></span>
              <span className="col-amount">{r.currency} {formatExactAmount(r.amount)}</span>
              <span className="col-date">{r.status === 'pending' ? r.createdAt : r.handledAt}</span>
              <span className="col-handler">{r.status === 'pending' ? '—' : r.handledBy}</span>
              <span className="col-status">{statusBadge(r.status, '已打款')}</span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="审核"
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/funds/withdraws/${r.id}`); }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          ))}
          {shownWithdraws.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">
              {isSearching ? '未找到匹配的提现申请' : reqFilter === 'pending' ? '暂无待处理的提现申请' : '暂无符合条件的提现申请'}
            </span></div>
          )}
        </div>
      )}

      {/* 换汇处理（2026-08-19 tab 3）：银行人工换汇完成后录入实际汇率上账 */}
      {activeTab === 'exchanges' && (
        <div className="admin-table admin-table--exchanges">
          <div className="admin-table-header">
            <span className="col-id">申请单号</span>
            <span className="col-name">申请人</span>
            <span className="col-amount">币种对</span>
            <span className="col-date">申请时间</span>
            <span className="col-handler">处理人</span>
            <span className="col-status">状态</span>
            <span className="col-actions">操作</span>
          </div>
          {shownExchanges.map(r => (
            <div
              key={r.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/funds/exchanges/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/funds/exchanges/${r.id}`); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name"><strong>{r.userName}</strong></span>
              <span className="col-amount col-amount--stack">
                <span>{r.fromCurrency} {formatExactAmount(r.amount)} → {r.toCurrency}</span>
                {r.status === 'approved' && <span className="col-amount-sub">实际 {formatExactAmount(r.actualAmount)}</span>}
              </span>
              <span className="col-date">{r.status === 'pending' ? r.createdAt : r.handledAt}</span>
              <span className="col-handler">{r.status === 'pending' ? '—' : r.handledBy}</span>
              <span className="col-status">{statusBadge(r.status, '已完成')}</span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="处理"
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/funds/exchanges/${r.id}`); }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          ))}
          {shownExchanges.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">
              {isSearching ? '未找到匹配的换汇申请' : reqFilter === 'pending' ? '暂无待处理的换汇申请' : '暂无符合条件的换汇申请'}
            </span></div>
          )}
        </div>
      )}

      {/* 白名单审核（2026-08-19 tab 4）：验证款核对 → 卡片置白名单 */}
      {activeTab === 'verifications' && (
        <div className="admin-table admin-table--verifications">
          <div className="admin-table-header">
            <span className="col-id">验证单号</span>
            <span className="col-name">申请人</span>
            <span className="col-amount">验证款</span>
            <span className="col-date">申请时间</span>
            <span className="col-handler">处理人</span>
            <span className="col-status">状态</span>
            <span className="col-actions">操作</span>
          </div>
          {shownVerifications.map(r => (
            <div
              key={r.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/funds/verifications/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/funds/verifications/${r.id}`); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name"><strong>{r.userName}</strong></span>
              <span className="col-amount">{r.currency} {formatExactAmount(r.amount)} · {r.bank} {r.maskedNo}</span>
              <span className="col-date">{r.status === 'pending' ? r.createdAt : r.handledAt}</span>
              <span className="col-handler">{r.status === 'pending' ? '—' : r.handledBy}</span>
              <span className="col-status">{statusBadge(r.status, '已白名单')}</span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="核对"
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/funds/verifications/${r.id}`); }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          ))}
          {shownVerifications.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">
              {isSearching ? '未找到匹配的验证申请' : reqFilter === 'pending' ? '暂无待处理的白名单验证' : '暂无符合条件的验证申请'}
            </span></div>
          )}
        </div>
      )}

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
