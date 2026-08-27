import { useState } from 'react';
import { ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import { getProjectById, getInvestorRoster, currentUser, getInvestorNo, subscriptions, formatListDateTime, formatISODateTime } from '../mock/data';
import SubscribeSheet from '../components/SubscribeSheet';
import { useLang } from '../i18n';

export default function ProjectHeat({ id, navigate, goBack }) {
  const { t } = useLang();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const project = getProjectById(id);

  if (!project) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#projects')}><ArrowLeft size={20} /></button>
          <h1>{t('项目未找到')}</h1>
        </div>
      </div>
    );
  }

  const roster = getInvestorRoster(project);
  const total = roster.length;
  // 多用户化（2026-08-13）：按投资人过滤，避免命中其他客户在该项目的申购
  const mySub = subscriptions.find(s => s.projectId === id && s.investorNo === getInvestorNo(currentUser.id));
  const hasActiveSub = !!mySub && mySub.status !== 'unallocated';
  const hasUnallocated = !!mySub && mySub.status === 'unallocated';
  const isOpen = project.status === 'raising' || project.status === 'upcoming';
  // 我的位次（is-me 高亮为前端个性化渲染，仅本人可见，无名单中立性问题）
  const myInvestorNo = getInvestorNo(currentUser.id);
  const myIndex = roster.findIndex(r => r.investorNo === myInvestorNo);
  const myRank = myIndex >= 0 ? myIndex + 1 : roster.length;

  return (
    <div className="page project-heat-page">
      <div className="detail-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack(`#project/${project.id}`)}><ArrowLeft size={20} /></button>
          <h1>{project.title}</h1>
        </div>
      </div>

      {/* hero：已提交 → 我的位次主角卡（透明度核心）；未提交 → 公开热度动员卡 */}
      {hasActiveSub && mySub ? (
        <div className="heat-rank-hero">
          <span className="heat-rank-hero-label">{t('我的当前位次')}</span>
          <div className="heat-rank-hero-value">{t('第 {} 位').replace('{}', myRank)}</div>
          <div className="heat-rank-hero-meta">
            {t('共 {} 位投资人 · 您之前 {} 位').replace('{}', total).replace('{}', myRank - 1)}
          </div>
          <div className="heat-rank-hero-sub">
            {t('提交于 {}').replace('{}', formatISODateTime(mySub.createdAt))}
          </div>
        </div>
      ) : (
        <div className="heat-rank-hero">
          <span className="heat-rank-hero-label">{t('已提交意向')}</span>
          <div className="heat-rank-hero-value">{t('{} 位投资人').replace('{}', total)}</div>
          <div className="heat-rank-hero-meta">
            {project.status === 'closed' || project.status === 'sold'
              ? t('本轮份额已分配完毕')
              : t('份额有限 · 先提交先协调')}
          </div>
        </div>
      )}

      <p className="heat-rule">
        {isOpen
          ? t('本项目份额有限，将按意向提交的先后次序作为协调额度的参考，最终以平台与项目方协调结果为准。')
          : t('本轮份额已分配完毕，以下为本轮意向提交记录。')}
      </p>

      <div className="card heat-card">
        <div className="heat-list roster-list">
          <div className="heat-row heat-head-row">
            <span className="heat-head-label heat-rank-no">{t('位次')}</span>
            <span className="heat-head-label heat-investor">{t('投资人')}</span>
            <span className="heat-head-label">{t('提交时间')}</span>
          </div>
          {roster.map((r, i) => {
            const isMe = r.investorNo === myInvestorNo;
            return (
              <div key={r.id} className={`heat-row${isMe ? ' is-me' : ''}`}>
                <span className="heat-rank-no">{i + 1}</span>
                <span className="heat-investor">
                  {r.investorNo}
                  {isMe && <em className="heat-me-tag">{t('我')}</em>}
                </span>
                <span className="text-muted text-sm date-iso">{formatListDateTime(r.createdAt)}</span>
              </div>
            );
          })}
        </div>
        <p className="heat-privacy-note">
          <ShieldCheck size={13} />
          {t('列表仅展示脱敏信息，投资人身份信息已加密保护')}
        </p>
      </div>

      {/* CTA：已申购用户引导去我的申购详情页；未申购用户引导提交 */}
      {hasActiveSub && mySub && (
        <button className="heat-cta-link" onClick={() => navigate(`#my-subscription/${mySub.id}`)}>
          <span>{t('查看我的申购进度 ›')}</span>
          <ChevronRight size={15} />
        </button>
      )}

      {isOpen && !hasActiveSub && (
        <div className="detail-actions">
          <button className="btn btn-primary btn-full" onClick={() => setShowSubscribe(true)}>
            {hasUnallocated ? t('重新提交申购意向') : t('提交申购意向')}
          </button>
          <p className="text-muted text-sm heat-cta-note">
            {hasUnallocated ? t('上一轮未获配额，新一轮已开放，可再次提交') : t('提交后即可查看您的位次')}
          </p>
        </div>
      )}

      {showSubscribe && (
        <SubscribeSheet project={project} onClose={() => setShowSubscribe(false)} onSubmitted={() => setShowSubscribe(false)} />
      )}
    </div>
  );
}