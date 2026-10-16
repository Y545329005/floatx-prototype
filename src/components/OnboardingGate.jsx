import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLang } from '../i18n';
import { recordAgreement, currentUser } from '../mock/data';
import AgreementModal from './AgreementModal';
import AgreeCheckbox from './AgreeCheckbox';

// 开户协议闸门（2026-10-15 · UC 对齐）：注册已后置为集团 UC 身份层开户，不再勾选基金业务协议；
// 三件套（用户协议/隐私条款/风险披露声明）改在 KYC 审核通过后首次进 APP 时全屏签署——
// 合规时点：销售行为（申购）之前 + 适当性评估（KYC/PI）完成之后。签一次终身有效（agreementRecords
// 按 userId 持久化），条款更新重同意走 TermsUpdateGate 既有机制，两闸门互不替代。
// 判定与挂载在 App.jsx（独立壳）；嵌入壳按嵌入集成轮另行处理。
function OnboardingGate({ onAgreed, onDecline }) {
  const { t, lang } = useLang();
  const [agreed, setAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const pick = (dict) => dict[lang] || dict['zh-CN'];

  const ONBOARDING_IDS = ['user-agreement', 'privacy-policy', 'risk-disclosure'];
  const LABELS = {
    'user-agreement': t('用户协议'),
    'privacy-policy': t('隐私条款'),
    'risk-disclosure': t('风险披露声明'),
  };

  const handleConfirm = () => {
    if (!agreed) return;
    // 留痕：type 'onboarding'，版本固化（recordAgreement 内部取 agreements 当前版本）
    recordAgreement({ type: 'onboarding', agreementIds: ONBOARDING_IDS, userId: currentUser.id });
    onAgreed && onAgreed();
  };

  return (
    <div className="terms-gate-mask">
      <div className="terms-gate-card" role="dialog" aria-modal="true" aria-label={t('服务协议与风险披露')}>
        <div className="terms-gate-icon"><ShieldCheck size={22} /></div>
        <h3>{t('服务协议与风险披露')}</h3>
        <p className="terms-gate-desc">
          {t('欢迎使用本平台基金服务。完成身份认证后，请查阅并同意下列协议，以建立服务关系：')}
        </p>
        <div className="terms-gate-docs">
          {ONBOARDING_IDS.map(id => (
            <button key={id} type="button" className="terms-gate-doc-link" onClick={() => setViewingDoc(id)}>
              {LABELS[id]} ›
            </button>
          ))}
        </div>
        {/* 强制同意闸门：无遮罩点击/Esc 关闭路径（合规语义），勾选已键盘可达（AgreeCheckbox） */}
        <AgreeCheckbox
          checked={agreed}
          onToggle={() => setAgreed(!agreed)}
          className="form-checkbox-group terms-gate-agree"
          style={{ cursor: 'pointer' }}
          label={t('我已阅读并同意上述协议')}
        >
          <span>{t('我已阅读并同意上述协议')}</span>
        </AgreeCheckbox>
        <button
          className="btn btn-primary btn-full terms-gate-submit"
          disabled={!agreed}
          style={{ opacity: agreed ? 1 : 0.45 }}
          onClick={handleConfirm}
        >
          {t('确认并继续')}
        </button>
        {/* 拒绝出口（2026-10-15）：开户协议是建立服务关系的前提，须给「不签」的真实选项——
            拒绝语义=不建立服务关系，二次确认后果后登出（与 Profile 退出登录同一落点） */}
        {!confirmingDecline && (
          <button
            type="button"
            className="terms-gate-decline"
            onClick={() => setConfirmingDecline(true)}
          >
            {t('暂不同意')}
          </button>
        )}
        {confirmingDecline && (
          <div className="terms-gate-decline-confirm">
            <p>{t('未签署开户协议，将无法使用基金服务。您可以稍后重新登录再签署，或联系客服咨询。')}</p>
            <div className="terms-gate-decline-actions">
              <button
                type="button"
                className="btn btn-full terms-gate-decline-cancel"
                onClick={() => setConfirmingDecline(false)}
              >
                {t('返回签署')}
              </button>
              <button
                type="button"
                className="btn btn-full terms-gate-decline-ok"
                onClick={() => onDecline && onDecline()}
              >
                {t('确认并退出')}
              </button>
            </div>
          </div>
        )}
      </div>
      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}

export default OnboardingGate;
