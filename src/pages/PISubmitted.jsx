import { ArrowLeft, CheckCircle, Clock, XCircle, RefreshCcw, Award } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser } from "../mock/data";

// PI 认证状态页（2026-08-14 · 独立 PI 审核流）：KYCPI 提交后进入待审核态，后台核验通过才 isPI=true
// 状态由 currentUser.pi.status 动态读取（pending 待审核 / verified 已认证 / rejected 已拒绝）+
// expiresAt 过期派生 EXPIRED（需重认证）。KYC 通过 ≠ PI——两者独立审核（KYC=实名，PI=资格）。
export default function PISubmitted({ navigate, goBack }) {
  const { t } = useLang();
  const pi = currentUser.pi || {};
  let status = pi.status || 'pending'; // pending | verified | rejected
  // 过期派生：verified 且 expiresAt 已过 → EXPIRED（重认证）
  if (status === 'verified' && pi.expiresAt) {
    const t = new Date(pi.expiresAt.replace(' ', 'T')).getTime();
    if (!Number.isNaN(t) && t < Date.now()) status = 'expired';
  }
  const reason = currentUser.kyc_profile?.rejectReason || '';

  const renderState = () => {
    if (status === 'verified') {
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--success-light)' }}>
            <CheckCircle size={32} style={{ color: 'var(--success)' }} />
          </div>
          <div className="kyc-success-title">{t('PI 认证已通过')}</div>
          <div className="kyc-success-desc">
            {t('您已获得专业投资者资格，可参与平台的稀缺份额申购。')}
          </div>
          {pi.expiresAt && (
            <div className="kyc-reject-reason" style={{ background: 'var(--bg)', borderColor: 'var(--border-light)' }}>
              <span className="kyc-reject-reason-label">{t('认证有效期至')}</span>
              <span className="kyc-reject-reason-text">{pi.expiresAt}</span>
            </div>
          )}
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate('projects')}>
              {t('去申购项目')}
            </button>
            <button
              className="kyc-btn kyc-btn-secondary"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => navigate('profile')}
            >
              {t('返回我的')}
            </button>
          </div>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--compliance-light)' }}>
            <XCircle size={32} style={{ color: 'var(--compliance)' }} />
          </div>
          <div className="kyc-success-title">{t('PI 认证未通过')}</div>
          <div className="kyc-success-desc">
            {t('很抱歉，您的专业投资者资格申请未通过审核。请根据以下原因修正后重新提交。')}
          </div>
          <div className="kyc-reject-reason">
            <span className="kyc-reject-reason-label">{t('未通过原因')}</span>
            <span className="kyc-reject-reason-text">{reason || t('资料不完整')}</span>
          </div>
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate('kyc-pi')}>
              <RefreshCcw size={16} /> {t('重新提交认证')}
            </button>
            <button
              className="kyc-btn kyc-btn-secondary"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => navigate('profile')}
            >
              {t('返回我的')}
            </button>
          </div>
        </div>
      );
    }
    if (status === 'expired') {
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--warning-light)' }}>
            <RefreshCcw size={32} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="kyc-success-title">{t('PI 认证已过期')}</div>
          <div className="kyc-success-desc">
            {t('您的专业投资者资格已到期，需重新提交认证资料以恢复参与资格。')}
          </div>
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate('kyc-pi')}>
              <RefreshCcw size={16} /> {t('重新认证')}
            </button>
            <button
              className="kyc-btn kyc-btn-secondary"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => navigate('profile')}
            >
              {t('返回我的')}
            </button>
          </div>
        </div>
      );
    }
    // 默认：pending 待审核
    return (
      <div className="kyc-card kyc-success-card">
        <div className="kyc-success-icon">
          <Award size={32} />
        </div>
        <div className="kyc-success-title">{t('PI 认证审核中')}</div>
        <div className="kyc-success-desc">
          {t('您的专业投资者认证申请已成功提交，我们将在 1-3 个工作日内完成审核。')}
          <br /><br />
          {t('审核结果将通过短信及站内通知发送，请保持手机畅通。')}
        </div>
        <div style={{ textAlign: 'left', marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
              {t('审核内容')}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {t('平台将核验您的资产证明或持牌资质，确认符合香港证监会专业投资者标准。')}
          </div>
        </div>
        <div className="kyc-actions-inline" style={{ marginTop: 'var(--space-4)' }}>
          <button className="kyc-btn kyc-btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => navigate('profile')}>
            {t('返回我的')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="kyc-page pi-submitted-page">
      {/* 吸顶：back + title */}
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('专业投资者认证')}</h1>
        </div>
      </div>

      <div className="kyc-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {renderState()}
      </div>
    </div>
  );
}
