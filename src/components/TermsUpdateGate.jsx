import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useLang } from '../i18n';
import { agreeTermsUpdate, termsState } from '../mock/data';
import AgreementModal from './AgreementModal';
import AgreeCheckbox from './AgreeCheckbox';

// 条款更新重新同意闸门（2026-09-15 · 对齐公司实践"条款更新"：
// 条款版本升级后（termsState.agreedVersion < currentVersion），登录后全屏弹窗通知 + 重新勾选同意方可继续使用）
function TermsUpdateGate({ onAgreed }) {
  const { t, lang } = useLang();
  const [agreed, setAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const pick = (dict) => dict[lang] || dict['zh-CN'];

  const UPDATED_IDS = ['user-agreement', 'privacy-policy', 'risk-disclosure'];
  const LABELS = {
    'user-agreement': t('用户协议'),
    'privacy-policy': t('隐私条款'),
    'risk-disclosure': t('风险披露声明'),
  };

  const handleConfirm = () => {
    if (!agreed) return;
    agreeTermsUpdate();
    onAgreed && onAgreed();
  };

  return (
    <div className="terms-gate-mask">
      <div className="terms-gate-card" role="dialog" aria-modal="true" aria-label={t('条款已更新')}>
        <div className="terms-gate-icon"><FileText size={22} /></div>
        <h3>{t('条款已更新')}</h3>
        <p className="terms-gate-desc">
          {t('我们更新了平台服务相关协议（当前版本 {}），请查阅并重新确认。').replace('{}', termsState.currentVersion)}
        </p>
        <div className="terms-gate-docs">
          {UPDATED_IDS.map(id => (
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
          label={t('我已阅读并同意更新后的协议')}
        >
          <span>{t('我已阅读并同意更新后的协议')}</span>
        </AgreeCheckbox>
        <button
          className="btn btn-primary btn-full terms-gate-submit"
          disabled={!agreed}
          style={{ opacity: agreed ? 1 : 0.45 }}
          onClick={handleConfirm}
        >
          {t('确认并继续')}
        </button>
      </div>
      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}

export default TermsUpdateGate;
