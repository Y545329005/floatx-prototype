import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLang, LanguageContext, LANGUAGES } from '../i18n';
import {
  resolvePublishPreviewToken, beginPublishPreview, clearPublishPreview, KYC_STATUS,
} from '../mock/data';
import ProjectDetail from './ProjectDetail';
import EventDetail from './EventDetail';

// 发布审批只读预览（2026-11-20 · BPM 审批动线 A+B 混合）
// 入口：BPM 工单 formData.previewUrl（#publish-preview/{token}，BPM 审批人新 tab 打开）。
// token：一次性语义 + 10 分钟 TTL + 绑定版本（resolvePublishPreviewToken 校验）。
// 渲染：beginPublishPreview 注入审批快照 + 固定 viewer（标准专业投资人画像），
//   ProjectDetail/EventDetail 走 getLive*ById 优先命中注入快照 —— 审批人实见投资人效果。
// 只读防线：viewer 注入使提交/报名动作在数据层直接拒绝（submitSubscription/registerEvent guard）。

// 切换器短标签（横幅空间有限；完整标签见 LANGUAGES）
const PREVIEW_LANG_SHORT = { 'zh-CN': '简', 'zh-HK': '繁', en: 'EN' };

// 标准专业投资人画像（预览期固定 viewer：KYC 已过 + PI 已认证未过期）
const PREVIEW_VIEWER = {
  id: 'preview-viewer',
  name: '预览 · 专业投资人',
  kyc_status: KYC_STATUS.APPROVED,
  pi: { status: 'verified', expiresAt: '2027-12-31 23:59:59' },
};

function PreviewState({ icon, title, desc }) {
  return (
    <div className="pub-preview-state">
      {icon}
      <h2>{title}</h2>
      <p>{desc}</p>
      <p className="pub-preview-hint">如需查看，请在 BPM 工单中重新打开预览链接，或由运营在「发布审批」进度中心重新生成。</p>
    </div>
  );
}

export default function PublishPreview({ token }) {
  const [result, setResult] = useState(null); // { ok, reason, data }

  /* 多语言预览（2026-11-24 标注⑤）：审批人核对运营配置的多语言内容。
     语言切换只作用于内容子树（局部 state），不写回投资人全局 zhifu-lang；
     内容翻译 = 字典词条（zhHK / en，与 LanguageProvider 同款动态加载与回退），
     简中原文即字典 key，未加载完成前回退显示简中。 */
  const { lang: outerLang } = useLang();
  const [lang, setLocalLang] = useState(outerLang);
  const [dict, setDict] = useState({});

  useEffect(() => {
    if (lang === 'zh-CN') { setDict({}); return; }
    let alive = true;
    const loader = lang === 'zh-HK' ? import('../i18n/zhHK') : import('../i18n/en');
    loader.then((m) => {
      if (!alive) return;
      setDict(lang === 'zh-HK' ? m.zhHK : m.en);
    });
    return () => { alive = false; };
  }, [lang]);

  const t = useCallback((key) => {
    if (typeof key !== 'string' || !key) return key;
    return dict[key] || key;
  }, [dict]);

  useEffect(() => {
    const res = resolvePublishPreviewToken(token);
    setResult(res);
    if (res.ok) beginPublishPreview(res.data.payload, PREVIEW_VIEWER);
    return () => clearPublishPreview();
  }, [token]);

  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="pub-preview-shell">
        <div className="pub-preview-banner pub-preview-banner-error">
          <AlertTriangle size={16} />
          <span>BPM 审批预览 · 链接无效{result.reason === 'expired' ? '（已过期，有效期 10 分钟）' : ''} —— 未发布内容不对外可见</span>
        </div>
        <PreviewState
          icon={<AlertTriangle size={32} />}
          title={result.reason === 'expired' ? '预览链接已过期' : '预览链接无效'}
          desc="预览链接为一次性限时凭证（10 分钟），过期或非法 token 不可查看未发布内容。"
        />
      </div>
    );
  }

  const { contentType, versionId } = result.data;
  const contentId = result.data.contentId;

  return (
    <div className="pub-preview-shell">
      <div className="pub-preview-banner">
        <ShieldCheck size={16} />
        <span>
          BPM 审批预览 · {contentType === 'project' ? '项目' : '路演'} {versionId}
          <span className="pub-preview-sep">·</span>预览为只读演示，审批操作请回 BPM 工单完成
        </span>
        <div className="pub-preview-lang" role="group" aria-label="预览语言">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              className={`pub-preview-lang-btn${lang === l.code ? ' is-active' : ''}`}
              onClick={() => setLocalLang(l.code)}
            >
              {PREVIEW_LANG_SHORT[l.code] || l.label}
            </button>
          ))}
        </div>
        <a className="pub-preview-bpm-link" href="bpm.html" target="_blank" rel="noreferrer"><ExternalLink size={13} /> 返回 BPM</a>
      </div>
      <div className="pub-preview-content">
        <LanguageContext.Provider value={{ lang, setLang: setLocalLang, t }}>
          {contentType === 'project'
            ? <ProjectDetail id={contentId} navigate={() => {}} goBack={() => {}} />
            : <EventDetail id={contentId} navigate={() => {}} goBack={() => {}} setToast={() => {}} />}
        </LanguageContext.Provider>
      </div>
    </div>
  );
}
