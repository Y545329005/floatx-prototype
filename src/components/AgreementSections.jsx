import { useLang } from '../i18n';
import { openExternal } from '../lib';

// 协议正文渲染（2026-11-16）：全 APP 唯一一套「章节 + 段落」语法。
// 通用条款走 AgreementModal（底部弹层），本人签署的委托协议走独立页（MandateAgreement），
// 两处只共用这一个组件——这样「条款换行/字距/标题层级」不会各写一份。
// 输入为原始 sections（三语字典 / 段落数组 / 字符串皆可），语言在组件内取，
// 因此调用方只需把 getAgreementById(...) 的结果直接传进来。

// 正文里的 http(s) 链接自动可点（公司简介/牌照信息要放官方网站）
const URL_SPLIT = /(https?:\/\/[^\s<>「」【】，。；()（）]+)/g;
const HAS_URL = /https?:\/\//;
const IS_URL = /^https?:\/\//;

// 《个人信息收集清单》三语字样（2026-11-25）：新版隐私政策以链接呈现清单
// （法务 docx 批注「请添加链接」）→ 由调用方挂 onOpenPrivacyList 渲染内链按钮
const LIST_SPLIT = /(《个人信息收集清单》|《個人資訊收集清單》|Personal Information Collection Checklist)/g;
const HAS_LIST = /(《个人信息收集清单》|《個人資訊收集清單》|Personal Information Collection Checklist)/;
const IS_LIST = /^(《个人信息收集清单》|《個人資訊收集清單》|Personal Information Collection Checklist)$/;

function Paragraph({ text, onOpenPrivacyList }) {
  // 清单字样段：挂了回调的调用方渲染内链按钮；未挂回调（委托协议页）不进此分支，纯文本
  if (HAS_LIST.test(text || '')) return <ListParagraph text={text} onOpenPrivacyList={onOpenPrivacyList} />;
  if (!HAS_URL.test(text || '')) return <p>{text}</p>;
  return (
    <p>
      {String(text).split(URL_SPLIT).map((part, i) => <UrlPart key={i} part={part} i={i} />)}
    </p>
  );
}

// URL 片段渲染：http(s) 可点（key 由调用处传入）
function UrlPart({ part, i }) {
  return (
        IS_URL.test(part)
          ? <a key={i} href={part} onClick={e => { e.preventDefault(); openExternal(part); }}>{part}</a>
          : part
  );
}

// 《个人信息收集清单》三语字样段（2026-11-25）：点击打开清单叠加层。
// 未挂 onOpenPrivacyList 的调用方（委托协议页等）不会走到 HAS_LIST 分支的按钮渲染，
// 字样保持纯文本，不暗示可点。
function ListParagraph({ text, onOpenPrivacyList }) {
  return (
    <p>
      {String(text).split(LIST_SPLIT).map((part, i) =>
        IS_LIST.test(part)
          ? <button key={i} type="button" className="agreement-inline-link" onClick={onOpenPrivacyList}>{part}</button>
          : <UrlPart key={i} part={part} i={i} />
      )}
    </p>
  );
}

export default function AgreementSections({ sections, onOpenPrivacyList }) {
  const { lang } = useLang();
  // 三语字典取当前语言，缺失回退简体；已是字符串则原样返回
  const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] || v['zh-CN']) : v);

  return (sections || []).map((s, i) => {
    const h = pick(s.h);
    const paras = Array.isArray(s.p) ? s.p : [s.p];
    return (
      <div key={i} className="agreement-section">
        {h ? <h4>{h}</h4> : null}
        {paras.map((para, pi) => <Paragraph key={pi} text={pick(para)} onOpenPrivacyList={onOpenPrivacyList} />)}
      </div>
    );
  });
}
