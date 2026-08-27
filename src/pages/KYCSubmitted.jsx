import { ArrowLeft, CheckCircle, Clock, ShieldCheck, XCircle, RefreshCcw } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, KYC_STATUS } from "../mock/data";

// KYC 流程提交后状态页：进度条 3 步 done + 按审核状态三态渲染（审核中/已通过/已拒绝+原因）
// 状态由 currentUser.kyc_status 动态读取——后台审核通过/拒绝后回流同步（userId 关联），重访本页即显示最新状态
export default function KYCSubmitted({ navigate, goBack }) {
  const { t } = useLang();
  const status = currentUser.kyc_status;

  const renderState = () => {
    if (status === KYC_STATUS.APPROVED) {
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--success-light)' }}>
            <CheckCircle size={32} style={{ color: 'var(--success)' }} />
          </div>
          <div className="kyc-success-title">{t('认证已通过')}</div>
          <div className="kyc-success-desc">
            {t('您已获得专业投资者资格，可参与平台的稀缺份额申购。')}
          </div>
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
    if (status === KYC_STATUS.REJECTED) {
      const reason = currentUser.kyc_profile?.rejectReason || t('资料不完整');
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--compliance-light)' }}>
            <XCircle size={32} style={{ color: 'var(--compliance)' }} />
          </div>
          <div className="kyc-success-title">{t('认证未通过')}</div>
          <div className="kyc-success-desc">
            {t('很抱歉，您的专业投资者认证资料未通过审核。请根据以下原因修正后重新提交。')}
          </div>
          <div className="kyc-reject-reason">
            <span className="kyc-reject-reason-label">{t('未通过原因')}</span>
            <span className="kyc-reject-reason-text">{reason}</span>
          </div>
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate('kyc-start')}>
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
    if (status === KYC_STATUS.REQUIRES_ACTION) {
      // 补件态（2026-08-13 P1）：后台退回补件后显示补件原因 + 重新提交——重提走 KYCStart 流程（材料可补充后提交）
      const reason = currentUser.kyc_profile?.rejectReason || t('材料需补充');
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--warning-light)' }}>
            <RefreshCcw size={32} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="kyc-success-title">{t('材料需补充')}</div>
          <div className="kyc-success-desc">
            {t('您的认证资料需要补充以下材料，补充完整后请重新提交。')}
          </div>
          <div className="kyc-reject-reason">
            <span className="kyc-reject-reason-label">{t('补件原因')}</span>
            <span className="kyc-reject-reason-text">{reason}</span>
          </div>
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate('kyc-start')}>
              <RefreshCcw size={16} /> {t('补充材料并重新提交')}
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
    // 默认：PENDING_REVIEW 等待审核
    return (
      <div className="kyc-card kyc-success-card">
        <div className="kyc-success-icon">
          <Clock size={32} />
        </div>
        <div className="kyc-success-title">{t('认证资料已提交')}</div>
        <div className="kyc-success-desc">
          {t('您的专业投资者认证资料已成功提交，我们将在 1-3 个工作日内完成审核。')}
          <br /><br />
          {t('审核结果将通过短信及站内通知发送，请保持手机畅通。')}
        </div>

        {/* 审核流程说明 */}
        <div style={{ textAlign: 'left', marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
              {t('审核内容')}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {t('平台将核验您的身份证件与地址证明的真实性，确认身份信息符合专业投资者认证标准。资料加密保存，仅用于本次认证审核。')}
          </div>
        </div>
        <div className="kyc-actions-inline" style={{ marginTop: 'var(--space-4)' }}>
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
  };

  return (
    <div className="kyc-page kyc-submitted-page">
      {/* 吸顶：back + title */}
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('专业投资者认证')}</h1>
        </div>
      </div>

      {/* 进度条：3 步骤全部 done */}
      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ width: '100%', background: 'var(--success)' }} />
          <span className="kyc-progress-dot done" style={{ left: '16.67%' }} />
          <span className="kyc-progress-dot done" style={{ left: '50%' }} />
          <span className="kyc-progress-dot done" style={{ left: '83.33%' }} />
        </div>
        <div className="kyc-progress-steps">
          <span className="kyc-progress-step done">1. {t('基本信息')}</span>
          <span className="kyc-progress-step done">2. {t('身份证件')}</span>
          <span className="kyc-progress-step done">3. {t('地址证明')}</span>
        </div>
      </div>

      <div className="kyc-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {renderState()}

        {/* 客服提示：轻量两行（完成态不部署完整顾问模块——完整联系方式在「我的」页；仅保留求助通道感） */}
        <div className="kyc-submit-hint" style={{ padding: 'var(--space-4)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            {t('审核期间如有疑问，可联系您的专属顾问')}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            {t('客服热线 400-888-0000')}
          </div>
        </div>
      </div>
    </div>
  );
}
