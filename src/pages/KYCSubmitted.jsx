import { ArrowLeft, CheckCircle, Clock, ShieldCheck, XCircle, RefreshCcw, Info } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, KYC_STATUS } from "../mock/data";

// KYC 流程提交后状态页：进度条 3 步 done + 按审核状态三态渲染（审核中/已通过/已拒绝+原因）
// 状态由 currentUser.kyc_status 动态读取——后台审核通过/拒绝后回流同步（userId 关联），重访本页即显示最新状态
export default function KYCSubmitted({ navigate, goBack }) {
  const { t } = useLang();
  const status = currentUser.kyc_status;

  const renderState = () => {
    if (status === KYC_STATUS.APPROVED) {
      // 2026-09-20：补 PI 就近入口——此前文案提醒"可进行专业投资者认证"但无按钮，入口只藏在「我的」页。
      // 按 PI 独立状态分支防误导：none/rejected/expired → 申报入口；pending → 查进度；verified 未过期 → 直接申购
      const pi = currentUser.pi || {};
      const piExpired = !!(pi.expiresAt && new Date(pi.expiresAt.replace(' ', 'T')).getTime() < Date.now());
      const piReady = pi.status === 'verified' && !piExpired;
      const piPending = pi.status === 'pending';
      const primaryAction = piReady
        ? { label: t('去申购项目'), target: 'projects' }
        : piPending
          ? { label: t('查看 PI 审核进度'), target: 'pi-submitted' }
          : { label: t('去 PI 认证'), target: 'kyc-pi' };
      return (
        <div className="kyc-card kyc-success-card">
          <div className="kyc-success-icon" style={{ background: 'var(--success-light)' }}>
            <CheckCircle size={32} style={{ color: 'var(--success)' }} />
          </div>
          <div className="kyc-success-title">{t('认证已通过')}</div>
          <div className="kyc-success-desc">
            {t('实名认证已通过，可进行专业投资者认证。')}
          </div>
          <div className="kyc-actions-inline">
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate(primaryAction.target)}>
              {primaryAction.label}
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
            {t('很抱歉，您的实名认证资料未通过审核。请根据以下原因修正后重新提交。')}
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
    // 2026-09-20（拍板）：PI 提交与 KYC 审核解耦——审核中即可连贯提交 PI 资料，按钮按 pi.status 分支防误导
    const pi = currentUser.pi || {};
    const piStatus = pi.status || 'none';
    const piAction = piStatus === 'pending'
      ? { label: t('查看 PI 审核进度'), target: 'pi-submitted' }
      : (piStatus === 'none' || piStatus === 'rejected')
        ? { label: t('去 PI 认证'), target: 'kyc-pi' }
        : null; // verified 未过期（KYC 重提场景）不显示 PI 入口
    return (
      <div className="kyc-card kyc-success-card">
        <div className="kyc-success-icon">
          <Clock size={32} />
        </div>
        <div className="kyc-success-title">{t('认证资料已提交')}</div>
        <div className="kyc-success-desc">
          {t('您的实名认证资料已成功提交，我们将在 1-3 个工作日内完成审核。')}
          <br /><br />
          {t('审核结果将通过短信及站内通知发送，请保持手机畅通。')}
        </div>

        {/* 2026-09-18：明确"无需重复提交"——用户从受保护页面（如账户设置）被门控引导到本页时，
            容易误以为要重新走认证流程。此说明澄清：已提交、审核中、通过后自动解锁功能。
            2026-09-20：补充 PI 并行提示（提交解耦拍板） */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
          <Info size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('实名认证审核中，无需重复提交。')}
            <br />
            {t('审核期间即可同步提交 PI 认证资料，两项审核并行推进。')}
          </span>
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
            {t('平台将核验您的身份证件与地址证明的真实性，确认身份信息真实有效。资料加密保存，仅用于本次认证审核。')}
          </div>
        </div>
        <div className="kyc-actions-inline" style={{ marginTop: 'var(--space-4)' }}>
          {piAction && (
            <button className="kyc-btn kyc-btn-primary" onClick={() => navigate(piAction.target)}>
              {piAction.label}
            </button>
          )}
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
          <h1>{t('认证状态')}</h1>
        </div>
      </div>

      {/* 进度条：3 步骤全部 done（2026-09-15 收敛为 3 步；KYC 内签署模块已移除） */}
      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ width: '100%', background: 'var(--success)' }} />
          <span className="kyc-progress-dot done" style={{ left: '16.5%' }} />
          <span className="kyc-progress-dot done" style={{ left: '50%' }} />
          <span className="kyc-progress-dot done" style={{ left: '83.5%' }} />
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
