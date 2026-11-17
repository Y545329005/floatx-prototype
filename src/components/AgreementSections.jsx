import { useLang } from '../i18n';

// 协议正文渲染（2026-11-16）：全 APP 唯一一套「章节 + 段落」语法。
// 通用条款走 AgreementModal（底部弹层），本人签署的委托协议走独立页（MandateAgreement），
// 两处只共用这一个组件——这样「条款换行/字距/标题层级」不会各写一份。
// 输入为原始 sections（三语字典 / 段落数组 / 字符串皆可），语言在组件内取，
// 因此调用方只需把 getAgreementById(...) 的结果直接传进来。

// 正文里的 http(s) 链接自动可点（公司简介/牌照信息要放官方网站）
const URL_SPLIT = /(https?:\/\/[^\s<>「」【】，。；()（）]+)/g;
const HAS_URL = /https?:\/\//;
const IS_URL = /^https?:\/\//;

function Paragraph({ text }) {
  if (!HAS_URL.test(text || '')) return <p>{text}</p>;
  return (
    <p>
      {String(text).split(URL_SPLIT).map((part, i) =>
        IS_URL.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
          : part
      )}
    </p>
  );
}

export default function AgreementSections({ sections }) {
  const { lang } = useLang();
  // 三语字典取当前语言，缺失回退简体；已是字符串则原样返回
  const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] || v['zh-CN']) : v);

  return (sections || []).map((s, i) => {
    const h = pick(s.h);
    const paras = Array.isArray(s.p) ? s.p : [s.p];
    return (
      <div key={i} className="agreement-section">
        {h ? <h4>{h}</h4> : null}
        {paras.map((para, pi) => <Paragraph key={pi} text={pick(para)} />)}
      </div>
    );
  });
}
