import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ImageIcon, MapPin, Phone, X, History, Search, Eye, ClipboardCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  kycSubmissions, approveKycSubmission, rejectKycSubmission, requireKycAction, KYC_STATUS,
  maskName, maskPhone,
} from '../mock/data';
const statusMeta = {
  [KYC_STATUS.PENDING_REVIEW]: { label: '待审核', cls: 'admin-status-pending' },
  [KYC_STATUS.REQUIRES_ACTION]: { label: '需补件', cls: 'admin-status-requires' },
  [KYC_STATUS.APPROVED]: { label: '已通过', cls: 'admin-status-approved' },
  [KYC_STATUS.REJECTED]: { label: '已拒绝', cls: 'admin-status-rejected' },
};

// 审核动作留痕中文映射
const actionMeta = {
  submitted: { label: '提交资料', cls: 'submitted' },
  approved: { label: '审核通过', cls: 'approved' },
  rejected: { label: '审核拒绝', cls: 'rejected' },
  requires_action: { label: '退回补件', cls: 'requires' },
};

// 图片源：base64 对象（用户侧 FileReader 存 {name, size, dataUrl}）或字符串路径（mock 占位图）
const imgSrc = (v) => (typeof v === 'string' ? v : (v && v.dataUrl ? v.dataUrl : ''));

// 4 个状态筛选（同一实体状态分类，filter-row 与 Projects/Events/Subscriptions 一致；默认待审核 = 工作台心智）
const FILTERS = [
  { key: KYC_STATUS.PENDING_REVIEW, label: '待审核' },
  { key: KYC_STATUS.REQUIRES_ACTION, label: '需补件' },
  { key: KYC_STATUS.APPROVED, label: '已通过' },
  { key: KYC_STATUS.REJECTED, label: '已拒绝' },
];

const PAGE_SIZE = 5;

export default function AdminKYC({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...kycSubmissions]);
  // 审核动作展开（2026-08-13）：null | 'reject'（拒绝）| 'require'（退回补件）——原因必填共用表单
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);   // 原因必填内联报错（按钮始终可点，空原因点击 → 内联报错，非 disabled 静默）
  const reasonFormRef = useRef(null);                      // 原因表单 ref：空原因点击时滚动到表单让报错可见
  const [filter, setFilter] = useState(KYC_STATUS.PENDING_REVIEW);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 详情 URL 化（D1）：selected 由 URL param2 驱动，刷新/分享保留；抽屉打开态 = selected 存在
  const selected = detailId || null;
  const refresh = () => setItems([...kycSubmissions]);
  const sel = selected ? items.find(k => k.id === selected) : null;
  const goList = () => { if (navigate) navigate('#admin/kyc'); };
  const drawerOpen = !!selected;

  // 各状态计数（筛选按钮徽标）
  const filterCounts = FILTERS.reduce((acc, f) => {
    acc[f.key] = items.filter(k => k.status === f.key).length;
    return acc;
  }, {});

  // 跨状态搜索（主要功能：用户来电查认证进度，姓名/手机/邮箱原文匹配，脱敏不影响搜索）
  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const matches = (k) =>
    (k.name || '').toLowerCase().includes(kw)
    || (k.phone || '').toLowerCase().includes(kw)
    || (k.email || '').toLowerCase().includes(kw)
    || (k.profile?.fullNameEn || '').toLowerCase().includes(kw);
  // 有搜索词 → 跨全部状态；否则当前筛选状态列表
  const filtered = isSearching ? items.filter(matches) : items.filter(k => k.status === filter);

  // 分页（每页一屏，切筛选/搜索重置页码）
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const switchFilter = (key) => { setFilter(key); setPage(1); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  // 统一抽屉行为（对齐 Projects/Events/Registrations）：滚动锁定 + Esc 关闭
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const closeDrawer = () => { setAction(null); setReason(''); setReasonError(false); goList(); };

  const handleApprove = (kid) => {
    approveKycSubmission(kid, admin?.name || '系统');
    refresh();
    closeDrawer();
  };

  // 原因必填统一处理（拒绝 / 退回补件共用）：按钮始终可点，空原因点击 → 内联报错 + 滚动抽屉到表单
  const handleActionConfirm = () => {
    if (!selected) return;
    if (!reason.trim()) {
      setReasonError(true);
      // 内联错误渲染后（表单高度增加）再滚动到表单完全可见——点击时刻计算会被错误高度低估，底部裁剪
      setTimeout(() => {
        const body = reasonFormRef.current?.closest('.admin-drawer-body');
        const form = reasonFormRef.current;
        if (body && form) {
          const bodyRect = body.getBoundingClientRect();
          const formRect = form.getBoundingClientRect();
          const target = Math.max(0, body.scrollTop + (formRect.bottom - bodyRect.bottom));
          body.scrollTo({ top: target, behavior: 'smooth' });
        }
      }, 60);
      return;
    }
    if (action === 'reject') rejectKycSubmission(selected, reason.trim(), admin?.name || '系统');
    else if (action === 'require') requireKycAction(selected, reason.trim(), admin?.name || '系统');
    setAction(null);
    setReason('');
    setReasonError(false);
    refresh();
    closeDrawer();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>KYC 审核</h1>
      </div>

      {/* 视图控制行：左状态筛选（filter-row，与 Projects/Events/Subscriptions 一致）+ 右跨状态搜索（检索态，主要功能） */}
      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key && !isSearching ? 'active' : ''}`}
              onClick={() => switchFilter(f.key)}
            >
              {f.label} {filterCounts[f.key]}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索姓名 / 手机 / 邮箱"
            placeholder="搜索姓名 / 手机 / 邮箱"
            value={keyword}
            onChange={e => onSearchChange(e.target.value)}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => onSearchChange('')}><X size={16} /></button>
          )}
        </div>
      </div>

      {/* 全宽列表（行点击 → 弹抽屉详情；列表脱敏 PDPO，抽屉授权全量） */}
      <div className="admin-table admin-table--kyc">
        <div className="admin-table-header">
          <span className="col-name">申请人</span>
          <span className="col-doc">证件类型</span>
          <span className="col-phone">联系方式</span>
          <span className="col-date">提交时间</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(k => {
          const meta = statusMeta[k.status];
          const docLabel = k.profile.idDocType === 'HK_ID' ? '香港身份证' : k.profile.idDocType === 'PASSPORT' ? '护照' : '内地通行证';
          const openDrawer = () => { navigate(`#admin/kyc/${k.id}`); };
          return (
            <div
              key={k.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/kyc/${k.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(); } }}
            >
              <span className="col-name">
                <strong>{maskName(k.name)}</strong>
              </span>
              <span className="col-doc">{docLabel}</span>
              <span className="col-phone">{maskPhone(k.phone)}</span>
              <span className="col-date">{k.submittedAt}</span>
              <span className="col-status">
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
              </span>
              <span className="col-actions">
                {/* 操作列 btn-icon + tooltip（规范 §四 4.3）；icon 语义 = 操作动词：审核=ClipboardCheck、查看=Eye */}
                {k.status === KYC_STATUS.PENDING_REVIEW ? (
                  <button
                    className="btn-icon"
                    title="审核认证资料"
                    onClick={(e) => { e.stopPropagation(); openDrawer(); }}
                  >
                    <ClipboardCheck size={16} />
                  </button>
                ) : (
                  <button
                    className="btn-icon"
                    title="查看认证资料"
                    onClick={(e) => { e.stopPropagation(); openDrawer(); }}
                  >
                    <Eye size={16} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {isSearching ? '未找到匹配用户' : `暂无${FILTERS.find(f => f.key === filter)?.label || ''}申请`}
            </span>
          </div>
        )}
      </div>

      {/* 分页（每页一屏，对齐 Registrations） */}
      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 条</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 统一右侧抽屉：认证资料详情 + 审核操作 + 审核留痕（授权查看全量） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && sel && (
        <div className="admin-drawer" role="dialog" aria-label={`认证资料 #${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">认证资料 #{sel.id} · {sel.name}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="kyc-review-grid">
              <div className="card kyc-review-block">
                <h4 className="card-title">基本信息</h4>
                <div className="kyc-review-row"><span>姓名</span><strong>{sel.profile.fullName}</strong></div>
                <div className="kyc-review-row"><span>英文名</span><strong>{sel.profile.fullNameEn}</strong></div>
                <div className="kyc-review-row"><span>性别</span><strong>{sel.profile.gender === 'M' ? '男' : '女'}</strong></div>
                <div className="kyc-review-row"><span>出生日期</span><strong>{sel.profile.birthDate}</strong></div>
                <div className="kyc-review-row"><span>国籍</span><strong>{sel.profile.nationality}</strong></div>
                {/* 2026-08-14 PI 独立审核流：KYC 资料含 PI 自填声明（参考信息），KYC 通过≠PI——
                    PI 资格由独立 PI 认证审核（AdminPI）核验，不随 KYC 自动通过 */}
                <div className="kyc-review-row"><span>PI 类型</span><strong>{sel.profile.piType === 'asset' ? '持有 ≥800 万港币资产' : '专业投资人'}</strong></div>
                <div className="kyc-review-row"><span>PI 声明</span><strong>{sel.profile.piCertified ? '已签署' : '未签署'}</strong></div>
              </div>
              <div className="card kyc-review-block">
                <h4 className="card-title">证件</h4>
                <div className="kyc-review-row"><span>证件类型</span><strong>{sel.profile.idDocType === 'HK_ID' ? '香港身份证' : sel.profile.idDocType === 'PASSPORT' ? '护照' : '内地通行证'}</strong></div>
                <div className="kyc-review-row"><span>证件号码</span><strong>{sel.profile.idDocNumber || '—'}</strong></div>
                <div className="kyc-review-doc">
                  <div className="kyc-review-img">
                    {imgSrc(sel.profile.idDocFront) ? <img src={imgSrc(sel.profile.idDocFront)} alt="证件正面" /> : <><ImageIcon size={18} /><span>正面</span></>}
                    <span className="kyc-review-img-label">正面</span>
                  </div>
                  {sel.profile.idDocBack && (
                    <div className="kyc-review-img">
                      {imgSrc(sel.profile.idDocBack) ? <img src={imgSrc(sel.profile.idDocBack)} alt="证件背面" /> : <><ImageIcon size={18} /><span>背面</span></>}
                      <span className="kyc-review-img-label">背面</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card kyc-review-block">
                <h4 className="card-title">地址证明</h4>
                <div className="kyc-review-row"><span>证明类型</span><strong>{sel.profile.addressProofType === 'utility' ? '水电费账单' : sel.profile.addressProofType === 'bank' ? '银行月结单' : '政府文件'}</strong></div>
                <div className="kyc-review-row"><span><MapPin size={14} /></span><strong>{sel.profile.addressLine || '—'}</strong></div>
                <div className="kyc-review-doc">
                  <div className="kyc-review-img">
                    {imgSrc(sel.profile.addressProof) ? <img src={imgSrc(sel.profile.addressProof)} alt="地址证明" /> : <><ImageIcon size={18} /><span>证明文件</span></>}
                    <span className="kyc-review-img-label">证明文件</span>
                  </div>
                </div>
              </div>
              <div className="card kyc-review-block">
                <h4 className="card-title">联系与提交</h4>
                <div className="kyc-review-row"><span><Phone size={14} /></span><strong>{sel.phone}</strong></div>
                <div className="kyc-review-row"><span>邮箱</span><strong>{sel.email}</strong></div>
                <div className="kyc-review-row"><span>提交时间</span><strong>{sel.submittedAt}</strong></div>
                {sel.status === KYC_STATUS.REJECTED && (
                  <div className="kyc-review-reject">拒绝原因：{sel.rejectReason}</div>
                )}
                {sel.status === KYC_STATUS.REQUIRES_ACTION && (
                  <div className="kyc-review-reject">补件原因：{sel.rejectReason}</div>
                )}
              </div>
            </div>

            {/* 制裁/PEP筛查区块（2026-08-26 任务5新增） */}
            <div className="card kyc-review-block kyc-screening-card">
              <h4 className="card-title"><ShieldCheck size={14} /> 制裁/PEP筛查</h4>
              <div className="kyc-review-row">
                <span>PEP状态</span>
                <strong className={sel.pepStatus === 'none' ? 'text-success' : 'text-warning'}>
                  {sel.pepStatus === 'none' ? '非PEP' : sel.pepStatus === 'foreign' ? '外国PEP' : sel.pepStatus === 'domestic' ? '国内PEP' : sel.pepStatus === 'international' ? '国际组织PEP' : 'PEP关联方'}
                </strong>
              </div>
              <div className="kyc-review-row">
                <span>风险等级</span>
                <strong className={sel.riskLevel === 'low' ? 'text-success' : sel.riskLevel === 'medium' ? 'text-warning' : 'text-danger'}>
                  {sel.riskLevel === 'low' ? '低风险' : sel.riskLevel === 'medium' ? '中风险' : '高风险'}
                </strong>
              </div>
              <div className="kyc-review-row">
                <span>最后评估</span>
                <strong>{sel.lastRiskAssessment || '—'}</strong>
              </div>
              {sel.sanctionsScreening && (
                <>
                  <div className="kyc-review-row">
                    <span>筛查状态</span>
                    <strong className={sel.sanctionsScreening.status === 'clear' ? 'text-success' : sel.sanctionsScreening.status === 'flagged' ? 'text-danger' : 'text-muted'}>
                      {sel.sanctionsScreening.status === 'clear' ? '✓ 已通过' : sel.sanctionsScreening.status === 'flagged' ? '⚠ 命中嫌疑' : '⏳ 待筛查'}
                    </strong>
                  </div>
                  {sel.sanctionsScreening.screenedAt && (
                    <div className="kyc-review-row">
                      <span>筛查时间</span>
                      <strong>{sel.sanctionsScreening.screenedAt}</strong>
                    </div>
                  )}
                  {sel.sanctionsScreening.hits && sel.sanctionsScreening.hits.length > 0 && (
                    <div className="kyc-screening-hits">
                      <div className="kyc-screening-hits-title">命中记录</div>
                      {sel.sanctionsScreening.hits.map((hit, idx) => (
                        <div className="kyc-screening-hit-item" key={idx}>
                          <div className="kyc-screening-hit-header">
                            <span className="kyc-screening-hit-list">{hit.list}</span>
                            <span className="kyc-screening-hit-score">匹配度 {(hit.matchScore * 100).toFixed(0)}%</span>
                          </div>
                          <div className="kyc-screening-hit-detail">
                            <span>匹配类型：{hit.matchType === 'name' ? '姓名匹配' : hit.matchType === 'identity' ? '身份匹配' : '其他'}</span>
                            <span>{hit.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* eKYC 核验结果（T3 · PRD §3.10 技术证据层）：人脸比对+活体+OCR 结果随申请入队 */}
            {sel.profile?.ekycResult && (
              <div className="card kyc-review-block kyc-screening-card">
                <h4 className="card-title"><ShieldCheck size={14} /> eKYC 核验结果</h4>
                <div className="kyc-review-row">
                  <span>核验状态</span>
                  <strong className={sel.profile.ekycResult.status === 'passed' ? 'text-success' : 'text-danger'}>
                    {sel.profile.ekycResult.status === 'passed' ? '✓ 已通过' : '✗ 未通过'}
                  </strong>
                </div>
                <div className="kyc-review-row">
                  <span>人脸比对</span>
                  <strong>相似度 {Math.round((sel.profile.ekycResult.score || 0) * 100)}%</strong>
                </div>
                <div className="kyc-review-row">
                  <span>活体检测</span>
                  <strong className={sel.profile.ekycResult.livenessPass ? 'text-success' : 'text-danger'}>
                    {sel.profile.ekycResult.livenessPass ? '通过' : '未通过'}
                  </strong>
                </div>
                <div className="kyc-review-row">
                  <span>证件识别</span>
                  <strong className={sel.profile.ekycResult.ocrPass ? 'text-success' : 'text-danger'}>
                    {sel.profile.ekycResult.ocrPass ? '通过' : '未通过'}
                  </strong>
                </div>
                {sel.profile.ekycResult.failReason && (
                  <div className="kyc-review-row">
                    <span>失败原因</span>
                    <strong className="text-danger">{sel.profile.ekycResult.failReason}</strong>
                  </div>
                )}
                <div className="kyc-review-row">
                  <span>核验时间</span>
                  <strong>{sel.profile.ekycResult.verifiedAt || '—'}</strong>
                </div>
                <div className="kyc-review-row">
                  <span>参考号</span>
                  <strong style={{ fontSize: 'var(--text-xs)', wordBreak: 'break-all' }}>{sel.profile.ekycResult.vendorRef || '—'}</strong>
                </div>
                <div className="kyc-screening-note">本结果为第三方服务商技术核验证据，人工复核为最终决策依据</div>
              </div>
            )}

            {/* 审核记录（留痕：谁 / 何时 / 动作 / 依据） */}
            <div className="card kyc-review-block kyc-history-card">
              <h4 className="card-title"><History size={14} /> 审核记录</h4>
              {sel.history && sel.history.length > 0 ? (
                sel.history.slice().reverse().map((h, i) => (
                  <div className="kyc-history-item" key={i}>
                    <span className={`kyc-history-dot ${actionMeta[h.action]?.cls || ''}`} />
                    <div className="kyc-history-body">
                      <div className="kyc-history-head">
                        <strong>{actionMeta[h.action]?.label || h.action}</strong>
                        <span className="kyc-history-operator">{h.operator}</span>
                      </div>
                      {h.note && <div className="kyc-history-note">{h.note}</div>}
                      <div className="kyc-history-time">{h.at}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted text-sm">暂无审核记录</div>
              )}
            </div>

                {sel.status === KYC_STATUS.PENDING_REVIEW && action && (
                  <div className="admin-reject-form" ref={reasonFormRef}>
                    <div className="form-group">
                      <label>{action === 'reject' ? '拒绝原因（必填，将通知申请人）' : '补件原因（必填，将通知申请人补充材料）'}</label>
                      <textarea
                        className={`form-input${reasonError ? ' field-error' : ''}`}
                        rows={3}
                        placeholder={action === 'reject' ? '例如：证件照片不清晰，请重新上传' : '例如：证件照片不清晰，请补充清晰证件照'}
                        value={reason}
                        onChange={e => { setReason(e.target.value); if (reasonError) setReasonError(false); }}
                      />
                      <div className="admin-reason-chips">
                        {['证件照片不清晰', '住址证明不在有效期内', '资料与实名信息不一致'].map(rc => (
                          <button key={rc} type="button" className="admin-reason-chip" onClick={() => { setReason(rc); setReasonError(false); }}>
                            {rc}
                          </button>
                        ))}
                      </div>
                      {reasonError && <span className="form-error">请填写原因</span>}
                    </div>
                  </div>
                )}
              </div>
              {sel.status === KYC_STATUS.PENDING_REVIEW && (
                <div className="admin-drawer-actions">
                  {action ? (
                    <>
                      <button className="btn btn-md btn-secondary" onClick={() => { setAction(null); setReason(''); setReasonError(false); }}>取消</button>
                      <button className="btn btn-md btn-outline" onClick={handleActionConfirm}>
                        {action === 'reject' ? <XCircle size={16} /> : <RotateCcw size={16} />} {action === 'reject' ? '确认拒绝' : '确认退回补件'}
                      </button>
                    </>) : (
                    <>
                      <button className="btn btn-md btn-outline" onClick={() => setAction('reject')}>
                        <XCircle size={16} /> 拒绝
                      </button>
                      <button className="btn btn-md btn-outline" onClick={() => setAction('require')}>
                        <RotateCcw size={16} /> 退回补件
                      </button>
                    </>
                  )}
                  <button className="btn btn-md btn-primary" onClick={() => handleApprove(sel.id)}>
                    <CheckCircle size={16} /> 通过认证
                  </button>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
