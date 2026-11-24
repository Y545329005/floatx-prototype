import { ArrowLeft } from 'lucide-react';
import DocViewport from '../components/DocViewport';
import { privacyCollectionScenes } from '../mock/privacyList';
import { useLang } from '../i18n';

// 个人信息收集清单（2026-11-24 · 「我的」页关于下一栏接入）
// 内容 = 法务 Final 定稿 docx 原文三语转录（mock/privacyList.js），研发不裁剪不改写；
// 呈现 = 法务原表照排（2026-11-24 用户拍板：合规内容直接展示原文，与其余法律文档查看态规范一致；
//   首版场景分组卡片已废弃）——4 列 + 合并单元格按原表：场景列按场景 rowspan、
//   保存期限列整列合并；页面标题即原表首行标题，正文不再重复（同一事实不两处）。
// 查看态 = 单据域同一查看器 DocViewport（2026-11-24 二次拍板：原表保真 + 可读性兼顾）——
//   默认 100% 保版式逐列细读（横向拖动），可切「适应宽度」整表通读；不另造第二套缩放交互。
// 门控 = guard.js COMPLIANCE_PATHS 白名单放行（静态法务披露零合规敞口，登录即可见，无 KYC/PI 门槛）。
export default function PrivacyList({ goBack }) {
  const { t, lang } = useLang();
  const pick = (v) => (v && typeof v === 'object' ? (v[lang] || v['zh-CN']) : v);
  const totalRows = privacyCollectionScenes.reduce((n, s) => n + s.rows.length, 0);
  return (
    <div className="page privacy-list-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('个人信息收集清单')}</h1>
        </div>
      </div>

      {/* contentWidth=640 与 .privacy-list-table 的 min-width 规格联动（改样式须同步） */}
      <DocViewport contentWidth={640}>
        <div className="privacy-list-table-wrap">
          <table className="privacy-list-table">
            <thead>
              <tr>
                <th>{t('核心场景/业务功能')}</th>
                <th>{t('信息种类')}</th>
                <th>{t('收集/使用目的')}</th>
                <th>{t('保存期限')}</th>
              </tr>
            </thead>
            <tbody>
              {privacyCollectionScenes.map((scene, si) =>
                scene.rows.map((row, ri) => (
                  <tr key={`${si}-${ri}`}>
                    {ri === 0 && (
                      <td rowSpan={scene.rows.length} className="privacy-list-scene-cell">
                        {pick(scene.scene)}
                      </td>
                    )}
                    <td>{pick(row.info)}</td>
                    <td>{pick(row.purpose)}</td>
                    {si === 0 && ri === 0 && (
                      <td rowSpan={totalRows} className="privacy-list-retention-cell">
                        {pick(row.retention)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DocViewport>
    </div>
  );
}
