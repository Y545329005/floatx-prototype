import { useEffect } from 'react';
import { X } from 'lucide-react';
import { getAgreementById } from '../mock/data';
import { useLang } from '../i18n';

// 协议详情弹窗（2026-09-15 · 对齐公司协议签署实践：点击协议名称弹窗展示全文，按当前界面语言切换）
// 全局协议（用户协议/隐私政策/风险披露/PI 条款/银行卡协议）统一走此组件；SPV 协议在签署页内嵌展示
// 2026-09-15 audit 修复：role=dialog + aria-modal + Esc 关闭（Esc 为真实键盘路径，ImageLightbox 注释有先例但未实现）；UI 标签接入 t()
export default function AgreementModal({ agreementId, onClose }) {
  const { t, lang } = useLang();
  const agreement = getAgreementById(agreementId);

  // Esc 关闭（hooks 须在 early return 之前注册）
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!agreement) return null;
  const pick = (dict) => dict[lang] || dict['zh-CN'];
  const sections = agreement.sections.map((s, i) => ({ key: i, h: pick(s.h), p: pick(s.p) }));
  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet agreement-modal-sheet" role="dialog" aria-modal="true" aria-label={pick(agreement.title)}>
        <div className="sheet-header">
          <div className="agreement-modal-head">
            <h3>{pick(agreement.title)}</h3>
            <span className="agreement-meta text-muted text-sm">
              {agreement.version} · {t('生效日期')} {agreement.effectiveAt}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label={t('关闭')}><X size={18} /></button>
        </div>
        <div className="agreement-modal-body">
          {sections.map(s => (
            <div key={s.key} className="agreement-section">
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-full agreement-modal-close" onClick={onClose}>
          {t('我已阅读')}
        </button>
      </div>
    </>
  );
}
