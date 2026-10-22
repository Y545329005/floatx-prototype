import { useEffect } from 'react';
import { X } from 'lucide-react';
import { getAgreementById } from '../mock/data';
import { useLang } from '../i18n';

// 协议详情弹窗（2026-09-15 · 对齐公司协议签署实践：点击协议名称弹窗展示全文，按当前界面语言切换）
// 全局协议（使用条款/隐私政策/风险披露/PI 条款/银行卡协议）统一走此组件
// 2026-09-15 audit 修复：role=dialog + aria-modal + Esc 关闭（Esc 为真实键盘路径，ImageLightbox 注释有先例但未实现）；UI 标签接入 t()
// 正文里的 http(s) 链接自动可点（2026-10-22：公司简介/牌照信息要放官方网站）
const URL_SPLIT = /(https?:\/\/[^\s<>「」【】，。；()（）]+)/g;
const HAS_URL = /https?:\/\//;
const IS_URL = /^https?:\/\//;

function Paragraph({ text }) {
  if (!HAS_URL.test(text)) return <p>{text}</p>;
  return (
    <p>
      {text.split(URL_SPLIT).map((part, i) =>
        IS_URL.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
          : part
      )}
    </p>
  );
}

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
  // 正式法务文本：p 为段落数组（一段一条）；旧条目 p 为三语字典/字符串
  const sections = agreement.sections.map((s, i) => ({
    key: i,
    h: pick(s.h),
    p: Array.isArray(s.p) ? s.p.map(x => pick(x)) : [pick(s.p)],
  }));
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
          {sections.map(s => (
            <div key={s.key} className="agreement-section">
              {s.h ? <h4>{s.h}</h4> : null}
              {s.p.map((para, pi) => <Paragraph key={pi} text={para} />)}
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
