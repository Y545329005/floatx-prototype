import { ArrowLeft, FileText, ChevronRight, Landmark, ShieldAlert } from 'lucide-react';
import NavChart from '../components/NavChart';
import { funds, getPiStatusForUser, PI_STATUS, currentUser, fundRangeReturns } from '../mock/data';
import { useLang } from '../i18n';

// 基金详情（2026-10-28 富途式改版）：Hero 收益大数字+业绩网格 → 净值走势 → 基金档案
// （管理人区块按自营/代售差异化：自营展示 HighBlock 管理，代售含分销披露）→ 法律文件 → 申购 CTA
const riskClass = (level) => (level === '低风险' || level === '中低风险') ? 'low' : level === '中风险' ? 'mid' : 'high';

export default function FundDetail({ id, navigate, goBack, setToast }) {
  const { t } = useLang();
  const fund = funds.find(f => f.id === id) || funds[0];
  const pi = getPiStatusForUser(currentUser.id);
  const canSubscribe = pi === PI_STATUS.APPROVED && fund.openForSubscription;
  const isSelf = fund.source === 'self';
  const ranges = fundRangeReturns(fund.navSeries);

  const openLegal = (type) => {
    // 复用平台三份法务文本：通过 about/legal 流程或直接提示
    navigate('#about');
    setToast && setToast(t('请在「关于」页查看相关法务文件'));
  };

  return (
    <div className="page fund-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#funds')}><ArrowLeft size={20} /></button>
          <h1>{t(fund.name)}</h1>
        </div>
      </div>

      <div className="card fund-detail-hero">
        <div className="fund-card-top">
          <span className={`fund-source-badge ${fund.source}`}>{t(isSelf ? '自营' : '代售')}</span>
          <span className={`tag tag-risk-${riskClass(fund.riskLevel)}`}>{t(fund.riskLevel)}</span>
          <span className="tag tag-outline">{t(fund.type)}</span>
          {fund.status === 'open' && <span className="tag tag-outline tag-purchasable">{t('可申购')}</span>}
        </div>
        <h2>{t(fund.name)}</h2>
        <p className="text-muted text-sm">{t(fund.description)}</p>
        <div className="fund-return fund-return-hero">
          <span className="fund-return-label">{t(fund.returnLabel)} · {t(fund.returnNote)}</span>
          <span className="fund-return-value">{t(fund.returnValue)}</span>
        </div>
        <div className="fund-metrics">
          <div className="fund-metric">
            <span className="fund-metric-label">{t('近6月')}</span>
            <span className="fund-metric-value fund-perf-pos">{ranges.m6}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('近1年')}</span>
            <span className="fund-metric-value fund-perf-pos">{ranges.y1}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('成立以来')}</span>
            <span className="fund-metric-value fund-perf-pos">{ranges.all}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{t('净值走势')}</h3>
        </div>
        <NavChart navSeries={fund.navSeries} />
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{t('基金档案')}</h3>
        </div>
        <div className={`fund-manager-block ${fund.source}`}>
          {isSelf ? (
            <>
              <Landmark size={18} />
              <div>
                <div className="fund-manager-name">{fund.manager}</div>
                <div className="text-muted text-sm">{t('由 HighBlock 资管团队管理（9 号牌资管）')}</div>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={18} />
              <div>
                <div className="fund-manager-name">{fund.manager}</div>
                <div className="text-muted text-sm">{t(fund.managerNote)}</div>
              </div>
            </>
          )}
        </div>
        <div className="fund-metrics">
          <div className="fund-metric">
            <span className="fund-metric-label">{t('成立时间')}</span>
            <span className="fund-metric-value">{fund.inceptionDate}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('基金规模')}</span>
            <span className="fund-metric-value">{t(fund.fundSize)}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('币种')}</span>
            <span className="fund-metric-value">{fund.currency.join(' / ')}</span>
          </div>
        </div>
        <div className="fund-metrics">
          <div className="fund-metric">
            <span className="fund-metric-label">{t('期限')}</span>
            <span className="fund-metric-value">{t(fund.term)}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('起投')}</span>
            <span className="fund-metric-value">HK$ {fund.minInvestment.toLocaleString()}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('锁定期')}</span>
            <span className="fund-metric-value">{t(fund.lockPeriod)}</span>
          </div>
        </div>
        <div className="fund-metrics">
          <div className="fund-metric">
            <span className="fund-metric-label">{t('最低持有期')}</span>
            <span className="fund-metric-value">{t(fund.minHoldPeriod || '-')}</span>
          </div>
          <div className="fund-metric">
            <span className="fund-metric-label">{t('赎回周期')}</span>
            <span className="fund-metric-value">{t(fund.redemptionPeriod || '-')}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><FileText size={16} /> {t('相关法律文件（平台法务文本）')}</h3>
        </div>
        {(fund.documents || []).map((d, idx) => (
          <button key={idx} className="list-item" onClick={() => openLegal(d.type)}>
            <div className="list-item-content">
              <div className="list-item-title">{t(d.name)}</div>
              <div className="list-item-subtitle">{t('查看平台已接入的法务文件')}</div>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      <div className="card">
        <p className="text-sm text-muted">{t('本平台为持牌资讯·咨询平台。基金申购与赎回均为人工确认流程：申购从账户可用余额扣款，财务确认后份额入账并出具结单。')}</p>
      </div>

      <div className="bottom-action-bar">
        {!canSubscribe && (
          <button className="btn btn-outline btn-full" onClick={() => navigate('#kyc-pi')}>
            {pi === PI_STATUS.PENDING_REVIEW ? t('PI 认证审核中') : t('需完成 PI 认证方可申购')}
          </button>
        )}
        {canSubscribe && (
          <button className="btn btn-primary btn-full" onClick={() => navigate(`#fund-subscribe/${fund.id}`)}>
            {t('申购申请')}
          </button>
        )}
      </div>
    </div>
  );
}
