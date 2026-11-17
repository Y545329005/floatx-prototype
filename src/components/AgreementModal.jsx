import { useEffect } from 'react';
import { X } from 'lucide-react';
import { getAgreementById } from '../mock/data';
import { useLang } from '../i18n';
import AgreementSections from './AgreementSections';

// 协议详情弹窗（2026-09-15 · 对齐公司协议签署实践：点击协议名称弹窗展示全文，按当前界面语言切换）
// 全局协议（使用条款/隐私政策/风险披露/PI 条款/银行卡协议）统一走此组件
// 2026-09-15 audit 修复：role=dialog + aria-modal + Esc 关闭（Esc 为真实键盘路径，ImageLightbox 注释有先例但未实现）；UI 标签接入 t()
// 2026-11-16：正文渲染抽到 AgreementSections，与委托协议页共用同一套章节/段落语法
export default function AgreementModal({ agreementId, onClose }) {
  const { t, lang } = useLang();
  const agreement = getAgreementById(agreementId, t);

  // Esc 关闭（hooks 须在 early return 之前注册）
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!agreement) return null;
  const pick = (dict) => dict[lang] || dict['zh-CN'];
  return (
    <>
      <div className="sheet-mask sheet-mask-elevated" onClick={onClose} />
      <div className="sheet agreement-modal-sheet" role="dialog" aria-modal="true" aria-label={pick(agreement.title)}>
        <div className="sheet-header">
          <div className="agreement-modal-head">
            {/* 2026-10-22：版本号与生效日期不展示——正式法务文本未载明，原型现值为占位；
                版本仍写入签署留痕（agreementRecords），需要时再开放展示 */}
            <h3>{pick(agreement.title)}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label={t('关闭')}><X size={18} /></button>
        </div>
        <div className="agreement-modal-body">
          <AgreementSections sections={agreement.sections} />
        </div>
        <button className="btn btn-primary btn-full agreement-modal-close" onClick={onClose}>
          {t('我已阅读')}
        </button>
      </div>
    </>
  );
}
