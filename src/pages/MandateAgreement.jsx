import { ArrowLeft, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import {
  getMandateSummaryForUser,
  getStandingAuthOf,
  getAgreementById,
  formatExactAmount,
} from '../mock/data';
import { useLang } from '../i18n';
import AgreementSections from '../components/AgreementSections';

/* ─────────────────────────────────────────────────────────────
   委托协议（2026-11-16 改版）：身份事实 + 纯文本正文 + 常设授权。
   改版原因：原版把 agreement 的 20 多个字段逐行重排成 KV——等于用前端维护第二份合同，
   条款一改就要动 JSX，且 KV 摘要缺条款编号与完整表述，法律上不等于合同。
   现在正文来自 agreements['mandate-agreement']（法务在后台以纯文本维护、三语），
   本人参数（经理/持牌代表/费率/限额/最低额）以 {{占位符}} 注入；页面只保留必须核对的四行身份。
   渲染与全 APP 通用条款同一套语法（AgreementSections），不再各自排版。
   ───────────────────────────────────────────────────────────── */

const AUTH_SCOPE_LABEL = {
  transfer: '资金划转',
  repledge: '再质押',
  lending: '借出',
};

export default function MandateAgreement({ goBack }) {
  const { t } = useLang();
  const summary = getMandateSummaryForUser();

  if (summary.state !== 'active') {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('委托协议')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
        </div>
      </div>
    );
  }

  const { account, agreement } = summary;
  const auths = getStandingAuthOf(account.id);
  const fees = agreement?.fees || {};
  const limits = agreement?.strategy?.limits || {};
  const day = (v) => String(v || '').slice(0, 10) || '—';

  // 本人协议参数：正文里的 {{占位符}}。缺值给 0 / '—'，宁可在页面露出占位符也不静默留空。
  const params = {
    MANAGER: account.managerName || '—',
    REP: agreement?.licensedRepName || '—',
    REP_CE: agreement?.licensedRepCE || '—',
    SINGLE_COMPANY: limits.singleCompanyPct ?? 0,
    SINGLE_ISSUER: limits.singleIssuerPct ?? 0,
    BORROWING_LIMIT: Number(limits.borrowingPct) || 0,
    MGMT_PCT: fees.managementPct ?? 0,
    INCEPT_PCT: fees.inceptionPct ?? 0,
    PERF_PCT: fees.performancePct ?? 0,
    HURDLE_PCT: fees.hurdlePct ?? 0,
    MIN_VALUE: Number(fees.minimumValue) > 0 ? formatExactAmount(fees.minimumValue) : '—',
    VAL_CCY: agreement?.valuationCurrency || 'HKD',
  };
  const doc = getAgreementById('mandate-agreement', t, params);

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${account.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('委托协议')}</h1>
        </div>
      </div>

      {/* 身份不再单独占一张卡（2026-11-17）：编号/生效/版本是"这是哪一份"的一句话，
          收进页头下的一行元信息——正文与它同屏，滚动时吸顶头仍在，核对成本比翻卡片更低。 */}
      <p className="mandate-doc-meta">
        {agreement?.no || '—'} · {day(agreement?.effectiveAt)} {t('生效')} · {agreement?.version || '—'}
      </p>

      {/* 正文：法务文本，章节 + 段落；数值由 params 注入，前端不写死任何条款数字 */}
      <div className="card">
        <div className="card-title">{t('协议正文')}</div>
        <AgreementSections sections={doc?.sections} />
      </div>

      {/* 附件：常设授权是另行签署的独立文件（有范围与有效期），协议扫描件是存档出口。
          两者都是"文件"，不是条款，所以与正文分开、按附件行排列。 */}
      <p className="mandate-section-label">{t('附件')}</p>
      <div className="menu-list">
        {/* 常设授权书：只有文件名（fileRef）没有文件地址，因此只作事实展示，不给可点暗示（2026-11-17） */}
        {auths.map(a => (
          <div key={a.id} className="menu-item is-static">
            <ShieldCheck size={18} aria-hidden="true" />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('常设授权书')}</span>
              <span className="menu-item-sub">
                {a.scope.map(sc => t(AUTH_SCOPE_LABEL[sc] || sc)).join(' · ')} · {t('有效期至')} {day(a.expiresAt)}
              </span>
            </span>
          </div>
        ))}
        {/* 协议扫描件：只预留入口（2026-11-17 拍板）——合规文件是否真实存在、以什么形式交付
            都还没确认，所以不显示「待上传」这类承诺性文案；`scanUrl` 一旦有值，
            本行才出现并可直接打开。数据字段与这条分支先留着，不删。 */}
        {agreement?.scanUrl ? (
          <button
            type="button"
            className="menu-item"
            onClick={() => window.open(agreement.scanUrl, '_blank', 'noopener')}
          >
            <FileText size={18} aria-hidden="true" />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('协议扫描件')}</span>
              <span className="menu-item-sub">{t('双方签署的正式文本')}</span>
            </span>
            <span className="mandate-file-action">{t('查看')}<ChevronRight size={14} aria-hidden="true" /></span>
          </button>
        ) : null}
      </div>

      {/* 正文已覆盖托管归属、费用扣减、估值与报告；这里只留正文没有的一句（收益不保证 + 费前口径） */}
      <p className="mandate-footnote">{t('投资收益不作保证；页面收益为费前口径。')}</p>
    </div>
  );
}
