import { useState } from 'react';
import { clickable } from '../lib';
import { ArrowLeft, Calendar, TrendingUp, FileText, Headphones, X, ChevronRight, Check } from 'lucide-react';
import { getProjectById, getEventsByProject, projectStatusLabels, getProjectHeroGradient, getProjectHeroEmoji, subscriptions, currentUser, getInvestorNo, formatCurrency, getProjectStageSlug, getCurrencySymbol, getSubscriptionGate } from '../mock/data';
import AccountManager from '../components/AccountManager';
import SubscribeSheet from '../components/SubscribeSheet';
import { useLang } from '../i18n';

function FinValue({ label, value }) {
  return (
    <div className="detail-stat">
      <span className="detail-stat-label">{label}</span>
      <span className="detail-stat-value text-sm">{value}</span>
    </div>
  );
}

export default function ProjectDetail({ id, navigate, goBack }) {
  const { t } = useLang();
  const [showManager, setShowManager] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [, setRefresh] = useState(0);
  const project = getProjectById(id);
  const relatedEvents = getEventsByProject(id);
  const isOpen = project && (project.status === 'raising' || project.status === 'upcoming');
  // 2026-08-17 申购资格校验：KYC + PI 强制拦截（未认证/审核中/过期 → CTA 变引导去认证页）
  const gate = getSubscriptionGate(currentUser);
  const myInvestorNo = getInvestorNo(currentUser.id);
  // 多用户化（2026-08-13）：必须按投资人过滤，避免命中其他客户在该项目的申购
  const mySub = subscriptions.find(s => s.projectId === id && s.investorNo === myInvestorNo);
  // 2026-10-22 RO 整改：申购热度（投资人名单 + 我的位次）整块移除——公开他人意向与排位属竞争性招揽红线

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

  const f = project.financials || {};

  return (
    <div className="page project-detail-page">
      <div className="detail-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack('#projects')}><ArrowLeft size={20} /></button>
          <h1>{project.title}</h1>
          <span className={`detail-header-badge status-${project.status}`}>{t(projectStatusLabels[project.status])}</span>
        </div>
      </div>

      <div
        className="project-detail-hero"
        style={{ background: getProjectHeroGradient(project.sector) }}
      >
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.title}
            className="detail-hero-img"
          />
        ) : (
          <span className="project-detail-hero-icon">{getProjectHeroEmoji(project.sector)}</span>
        )}
        <div className="project-detail-hero-tags">
          <span className={`tag tag-stage-${getProjectStageSlug(project.stage)}`}>{t(project.stage)}</span>
          <span className="tag tag-outline tag-on-hero">{t(project.sector)}</span>
        </div>
        <div className="project-detail-hero-company">{project.company}</div>
      </div>

      <div className="card card-accent">
        <div className="detail-stat-row">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('总部')}</span>
            <span className="detail-stat-value">{project.location}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">{t('融资阶段')}</span>
            <span className="detail-stat-value">{t(project.stage)}</span>
          </div>
        </div>
        <div className="detail-stat-row">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('上市计划')}</span>
            <span className="detail-stat-value text-sm">{project.ipoPlan}</span>
          </div>
        </div>
        {project.status === 'closed' && project.allocationDate && (
          <div className="detail-stat-row">
            <div className="detail-stat">
              <span className="detail-stat-label">{t('本轮分配完成')}</span>
              <span className="detail-stat-value">{project.allocationDate}</span>
            </div>
          </div>
        )}
        {project.status === 'upcoming' && (
          <div className="detail-stat-row">
            <div className="detail-stat">
              <span className="detail-stat-label">{t('意向开放时间')}</span>
              <span className="detail-stat-value">{t('待项目方确认')}</span>
            </div>
          </div>
        )}
        {project.status === 'raising' && (
          <div className="detail-stat-row">
            <div className="detail-stat">
              <span className="detail-stat-label">{t('意向收集截止')}</span>
              <span className="detail-stat-value">{project.intentDeadline || t('以平台沟通为准')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card card-secondary">
        <div className="card-title">{t('本轮情况')}</div>
        <div className="round-note">
          <p className="round-note-text">{project.roundNote}</p>
        </div>
      </div>

      <div className="card card-secondary">
        <div className="card-title">{t('项目亮点')}</div>
        <ul className="highlight-list">
          {project.highlights.map((h, i) => (
            <li key={i} className="highlight-item">
              <TrendingUp size={16} className="highlight-icon" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card card-secondary">
        <div className="card-title">{t('项目简介')}</div>
        <p className="text-body">{project.description}</p>
      </div>

      {(f.revenue !== undefined || f.burnRate !== undefined || f.grossMargin !== null && f.grossMargin !== undefined) && (
        <div className="card card-secondary">
          <div className="card-title">{t('财务概览')}</div>
          <div className="detail-stat-row">
            <FinValue label={t('营收')} value={f.revenue ? `${getCurrencySymbol(project.currency)} ${formatCurrency(f.revenue)}` : t('尚未产生收入')} />
            {f.burnRate !== undefined && <FinValue label={t('月净烧钱')} value={`${getCurrencySymbol(project.currency)} ${formatCurrency(f.burnRate)}`} />}
            {f.grossMargin != null && <FinValue label={t('毛利率')} value={f.grossMargin} />}
          </div>
        </div>
      )}

      {project.team && project.team.length > 0 && (
        <div className="card card-secondary">
          <div className="card-title">{t('核心团队')}</div>
          {project.team.map((m, i) => (
            <div key={i} className="team-member">
              <div className="team-member-avatar">{m.name[0]}</div>
              <div className="team-member-info">
                <strong>{m.name}</strong>
                <span className="text-muted text-sm">{m.role}</span>
                <p className="text-muted text-sm">{m.bg}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {relatedEvents.length > 0 && (
        <div className="card card-secondary">
          <div className="card-title">{t('相关路演')}</div>
          {relatedEvents.map(e => (
            <div key={e.id} className="related-event" {...clickable(() => navigate(`#event/${e.id}`))}>
              <Calendar size={16} />
              <div>
                <span>{e.title}</span>
                <span className="text-muted text-sm">{e.date} {e.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {project.documents && project.documents.length > 0 && (
        <div className="card card-secondary">
          <div className="card-title">{t('尽调材料')}</div>
          {project.documents.map((d, i) => (
            <a key={i} className="doc-item" href={d.url} onClick={e => e.preventDefault()}>
              <FileText size={16} />
              <span>{d.name}</span>
            </a>
          ))}
        </div>
      )}

      <button className="concierge-hint" onClick={() => setShowManager(true)}>
        <Headphones size={15} />
        <span>{t('有疑问？联系您的专属顾问')}</span>
        <ChevronRight size={15} />
      </button>

      {/* 问卷 CTA（2026-10-22 RO 整改：CTA 改「了解详情」，弹框为「问卷调查」——
          线上只收集投资意愿，线下与项目方协调；状态卡是后台登记进度的镜像，用户侧无签署/支付动作入口） */}
      <div className="detail-actions">
        {!mySub && isOpen && gate.ok && (
          <button className="btn btn-primary btn-full" onClick={() => setShowSubscribe(true)}>
            {t('了解详情')}
          </button>
        )}
        {!mySub && isOpen && !gate.ok && (
          <button className="btn btn-primary btn-full" onClick={() => navigate(`#${gate.target}`)}>
            {t(gate.labelKey)}
          </button>
        )}
        {!mySub && !isOpen && (
          <button className="btn btn-full" disabled>
            {t('本轮已结束')}
          </button>
        )}
        {mySub && mySub.status === 'signed' && (
          <>
            <div className="cta-status-card signed">
              <div className="cta-status-head">
                <Check size={16} />
                <strong>{t('已完成')}</strong>
              </div>
              <div className="cta-status-meta">
                <span>{t('意向档位')}</span>
                <strong className="date-iso">{(mySub.amount || 0) > 0 ? `HK$ ${formatCurrency(mySub.amount || 0)}` : t('无意向')}</strong>
              </div>
            </div>
            <button className="text-btn-cta" onClick={() => navigate(`#my-subscription/${mySub.id}`)}>
              {t('查看我的问卷 ›')}
            </button>
          </>
        )}
        {mySub && mySub.status === 'unallocated' && isOpen && gate.ok && (
          <>
            <div className="cta-status-card unallocated">
              <div className="cta-status-head">
                <strong>{t('本次提交暂无进一步安排')}</strong>
              </div>
              <p className="text-muted text-sm">{t('如有进一步意向，可重新填写问卷')}</p>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setShowSubscribe(true)}>
              {t('重新填写问卷')}
            </button>
          </>
        )}
        {mySub && mySub.status === 'unallocated' && isOpen && !gate.ok && (
          <>
            <div className="cta-status-card unallocated">
              <div className="cta-status-head">
                <strong>{t('本次提交暂无进一步安排')}</strong>
              </div>
              <p className="text-muted text-sm">{t('如有进一步意向，可重新填写问卷')}</p>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => navigate(`#${gate.target}`)}>
              {t(gate.labelKey)}
            </button>
          </>
        )}
        {mySub && (mySub.status === 'submitted' || mySub.status === 'allocated') && (
          <>
            <div className={`cta-status-card ${mySub.status}`}>
              <div className="cta-status-head">
                <Check size={16} />
                <strong>
                  {mySub.status === 'allocated' ? t('客户经理跟进中') : t('文件已提交')}
                </strong>
              </div>
              <div className="cta-status-meta">
                <span>{t('意向档位')}</span>
                <strong className="date-iso">{(mySub.amount || 0) > 0 ? `HK$ ${formatCurrency(mySub.amount || 0)}` : t('无意向')}</strong>
              </div>
              <div className="cta-status-meta">
                <span>
                  {mySub.status === 'allocated' ? t('客户经理将线下与您联系') : t('等待客户经理跟进')}
                </span>
              </div>
            </div>
            <button className="text-btn-cta" onClick={() => navigate(`#my-subscription/${mySub.id}`)}>
              {t('查看我的问卷 ›')}
            </button>
          </>
        )}
      </div>

      {showManager && (
        <div className="sheet-mask" onClick={() => setShowManager(false)} />
      )}
      {showManager && (
        <div className="sheet">
          <div className="sheet-header">
            <h3>{t('您的专属顾问')}</h3>
            <button className="btn-icon" onClick={() => setShowManager(false)}><X size={18} /></button>
          </div>
          <p className="text-muted text-sm sheet-sub">{t('关于本项目的任何疑问，可直接联系您的客户经理')}</p>
          <AccountManager onEscalate={() => navigate('#support')} />
        </div>
      )}

      {showSubscribe && (
        <SubscribeSheet
          project={project}
          onClose={() => setShowSubscribe(false)}
          onSubmitted={() => { setShowSubscribe(false); setRefresh(v => v + 1); }}
        />
      )}
    </div>
  );
}