import { useState } from 'react';
import { ChevronRight, Monitor, MapPin } from 'lucide-react';
import { clickable } from '../lib';
import {
  events, projects, projectStatusLabels, getProjectHeroGradient,
  subscriptions, currentUser, getInvestorNo, isEventLive, isEventRegistered,
} from '../mock/data';
import { useLang } from '../i18n';

// 财富聚合页（2026-10-14 对标改版 · 页签化）
// 定位：本 Tab 是「发现/募资页」（参照币安 / OKX 交易页顶部 Tab 切平级业务的形态——
// 路演与项目是同一发现域下的两种内容形态，互斥页签切换，每个页签内是**全量**内容，
// 不做「精选 3 条 + 全部入口」的截断：截断会造成切过去大半屏空白的页级浪费）。
// 排序维持 2026-10-13 拍板：路演在前（获客漏斗 + 时效性），默认选中「路演」页签。
// 2026-10-16 首期裁剪：资产单行入口摘除（#assets 随资产树下线，二期恢复）。
// 仅嵌入壳（embed.html）挂载；本页样式全在 embed.css，独立原型深链 #wealth 非支持形态。

// 周几词条（日历卡日期块用，WEEKDAY_KEYS 下标与 Date.getDay() 对齐）
const WEEKDAY_KEYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 路演卡（页签内纵向全宽）：左侧日期竖块做主视觉（日历本体的「日期块」语言），
// 右侧标题 + meta 行（行业 / 时间+线上/线下）；进行中、已报名以 pill 呈现。样式见 embed.css。
function EventCard({ e, navigate }) {
  const { t } = useLang();
  const live = isEventLive(e);
  const registered = isEventRegistered(e.id);
  const d = new Date(`${e.date}T00:00:00`);
  return (
    <div className="card wealth-cal-card" {...clickable(() => navigate(`#event/${e.id}`))}>
      <div className="wealth-cal-date" style={{ background: getProjectHeroGradient(e.sector) }}>
        <span className="wealth-cal-month">{e.date.slice(5, 7)}{t('月')}</span>
        <span className="wealth-cal-day">{e.date.slice(8, 10)}</span>
        <span className="wealth-cal-week">{t(WEEKDAY_KEYS[d.getDay()])}</span>
      </div>
      <div className="wealth-cal-body">
        {(live || registered) && (
          <div className="wealth-cal-badges">
            {live && <span className="wealth-cal-live">{t('进行中')}</span>}
            {registered && <span className="wealth-cal-reg">{t('已报名')}</span>}
          </div>
        )}
        <h3 className="wealth-cal-title">{e.title}</h3>
        <div className="wealth-cal-meta">
          <span className="wealth-cal-sector">{t(e.sector)}</span>
          <span className="wealth-cal-loc">
            {!live && <>{e.time.split('-')[0]} · </>}
            {e.type === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
            {e.type === 'online' ? t('线上会议') : e.location}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Wealth({ navigate }) {
  const { t } = useLang();
  const [tab, setTab] = useState('roadshow');

  // 页签内容全量取数（不再 slice 截断）：路演讲全部 upcoming（与 Events 页同源同序），
  // 项目取在募全部 + 即将上线分区（与 ProjectMarket 页同口径）
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const raisingProjects = projects.filter(p => p.status === 'raising');
  const upcomingProjects = projects.filter(p => p.status === 'upcoming');

  const renderProjectRow = (p) => {
    // 多用户化（2026-08-13）：按投资人过滤，"已申购"仅当前用户的记录
    const mySub = subscriptions.find(s => s.projectId === p.id && s.investorNo === getInvestorNo(currentUser.id));
    return (
      <div key={p.id} className="wealth-project-row" {...clickable(() => navigate(`#project/${p.id}`))}>
        {/* 行首圆标 = 项目名首字母（真实身份锚点，零维护；emoji 与项目无语义关联已弃用）。
            底色用中性 token（--primary-light/--primary）而非行业渐变：医疗健康等浅色
            渐变下白字对比度仅约 1.2:1 不可读，且新增行业需人工校准渐变深浅 */}
        <span className="wealth-row-icon">
          {p.title.trim().charAt(0).toUpperCase()}
        </span>
        <span className="wealth-row-info">
          {/* 名称独占一行（ellipsis 落在名称上）；「已申购」放副行末尾——放名称行会
              挤压名称被截断（实测 QuantumCore Technolc / MediConnect Health 已） */}
          <span className="wealth-row-name">{p.title}</span>
          <span className="wealth-row-sub">
            {/* 「已申购」前置：副行 ellipsis 截断时优先保住这个关键状态，损失地区尾字 */}
            {mySub && <span className="sub-mark">{t('已提交问卷')} · </span>}
            {p.stage} · {t(p.sector)} · {p.location}
          </span>
        </span>
        <span className={`wealth-row-badge ${p.status}`}>{t(projectStatusLabels[p.status])}</span>
        <ChevronRight size={16} className="wealth-row-arrow" />
      </div>
    );
  };

  return (
    <div className="page wealth-page">
      {/* 顶栏纯标题：客服/通知是账户级服务，归属「我的」Tab（不该挂业务页顶栏，
          币安顶栏 icon 之所以成立是因为它是全局壳顶栏，本嵌入壳无全局顶栏） */}
      <div className="market-header">
        <h1>{t('财富')}</h1>
      </div>

      {/* 页签：路演 / 项目互斥切换（复用市场页 segmented-control，默认路演保持获客位） */}
      <div className="segmented-control">
        <button className={tab === 'roadshow' ? 'active' : ''} onClick={() => setTab('roadshow')}>
          {t('路演')}
        </button>
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>
          {t('项目')}
        </button>
      </div>

      {tab === 'roadshow' ? (
        <section className="wealth-section">
          {upcomingEvents.length > 0 ? (
            <div className="wealth-cal-list">
              {upcomingEvents.map(e => <EventCard key={e.id} e={e} navigate={navigate} />)}
            </div>
          ) : (
            <div className="empty-state">{t('暂无即将开始的路演')}</div>
          )}
          <button className="text-btn link-btn wealth-foot-link" onClick={() => navigate('#events')}>
            {t('全部路演')}<ChevronRight size={14} />
          </button>
        </section>
      ) : (
        <section className="wealth-section">
          {raisingProjects.length > 0 || upcomingProjects.length > 0 ? (
            <div className="card wealth-project-list">
              {raisingProjects.map(renderProjectRow)}
              {upcomingProjects.length > 0 && <div className="section-divider">{t('即将上线')}</div>}
              {upcomingProjects.map(renderProjectRow)}
            </div>
          ) : (
            <div className="empty-state">{t('暂无在募项目')}</div>
          )}
          <button className="text-btn link-btn wealth-foot-link" onClick={() => navigate('#projects')}>
            {t('全部项目')}<ChevronRight size={14} />
          </button>
        </section>
      )}

      {/* 2026-10-16 首期裁剪：原「我的资产」单行入口整块摘除（#assets 下线） */}
    </div>
  );
}
