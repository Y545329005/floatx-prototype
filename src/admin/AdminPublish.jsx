import { useState, useEffect } from 'react';
import { Eye, ExternalLink, RotateCcw, UploadCloud, Undo2, PlayCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  getPublishRecords, getPublishStats, rollbackLive,
  withdrawSubmission, resetPublishDemo, createPublishPreviewToken,
} from '../mock/data';

// 发布审批进度中心（2026-11-20 · BPM 会签主审架构；2026-11-23 简化：通过即发布）
// 定位：工单流水（在审 + 审批结果），未进审批的内容（draft）不属于本域，在项目/路演页提交。
// 审批操作（通过/驳回/意见）只发生在集团 BPM（模拟页 /bpm.html）；双过/自动通过 webhook
// 到达即自动发布（无「待发布」态），本页呈现跨系统进度、意见互见、条款依据与运维动作。
// legal/ro 本地角色只读；ops 可撤销提交；super 只做运维（撤销提交/回滚），无发布按钮。
// 下架属于内容展示生命周期，入口在项目/路演内容页（2026-11-24 用户拍板）。

const BIZ_LABELS = {
  draft: '草稿',
  pending_review: '审批中',
  rejected: '已驳回',
  published: '已发布',
};

const BIZ_BADGE_CLASS = {
  draft: 'admin-status-closed',
  pending_review: 'admin-status-upcoming',
  rejected: 'admin-status-sold',
  published: 'admin-status-active',
};

const TRAIL_ICONS = { submit: UploadCloud, 'bpm-task': ShieldCheck, 'bpm-final': ShieldCheck, publish: PlayCircle, withdraw: Undo2 };

function fmtTime(s) { return s || '—'; }

/* 单一会签轨迹（2026-11-24 极简拍板）：提交 → 节点意见 → 流程结束 → 发布/撤销。
   意见只在此处讲一次：节点卡、BPM 状态行、条件横幅不再重复表达同一事实。 */
function ApprovalTrail({ rec }) {
  const cur = rec.current;
  const archived = rec.bizState === 'draft' && rec.archived;
  const trail = cur?.trail || rec.live?.trail || archived?.trail || [];
  if (!trail.length) return <div className="text-muted text-sm">暂无审批轨迹</div>;
  return (
    <div className="pub-timeline">
      {trail.map((t, i) => {
        const Icon = TRAIL_ICONS[t.kind] || ShieldCheck;
        // webhook 增量轨迹不带 voided；一驳即驳时按节点兜底标记。
        // 种子轨迹用 'ro'、webhook 用 'ro_review'，两种命名都要认，否则驳回意见会被误标作废。
        const isRo = t.node === 'ro' || t.node === 'ro_review';
        const voided = t.voided === true || (cur?.instanceState === 2 && t.kind === 'bpm-task' && !isRo);
        return (
          <div className={`pub-timeline-item${voided ? ' is-voided' : ''}`} key={`${t.at}-${i}`}>
            <span className="pub-timeline-icon"><Icon size={14} /></span>
            <div className="pub-timeline-body">
              <div className="pub-timeline-head">
                <strong>{t.action}</strong>
                <span className="text-muted text-sm">{t.actor}</span>
                <span className="pub-timeline-time">{fmtTime(t.at)}</span>
              </div>
              {t.opinion && <div className="pub-opinion">{t.opinion}</div>}
              {voided && <div className="pub-timeline-note">整版驳回，该节点意见作废</div>}
            </div>
          </div>
        );
      })}
      {cur?.instanceStateDesc === '审批中' && (
        <div className="pub-timeline-item is-pending">
          <span className="pub-timeline-icon"><RefreshCw size={14} /></span>
          <div className="pub-timeline-body">
            <div className="pub-timeline-head"><strong>会签进行中…</strong><span className="text-muted text-sm">等待 BPM 节点回调</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 时间列 = 最后一次流转时间（2026-11-24 用户拍板：不带动词，列头即语义）；候选全为 YYYY-MM-DD HH:mm:ss 格式，字符串比较即时间比较 */
function lastTouch(rec) {
  const stamps = [
    rec.current?.submittedAt,
    ...(rec.current?.tasks || []).map(t => t.operateTime),
    rec.live?.publishedAt,
    rec.archived?.unpublishedAt || rec.archived?.publishedAt,
  ].filter(Boolean);
  return stamps.length ? stamps.sort().pop() : '';
}

function StepNode({ node }) {
  return (
    <div className={`special-step special-step--${node.state}`}>
      <span className="special-step-dot" />
      <span>
        <span className="special-step-label">{node.label}</span>
        {node.meta ? <span className="special-step-meta">{node.meta}</span> : null}
      </span>
    </div>
  );
}

/* 抽屉顶部进度（2026-11-24 修订）：提交 →【法务 / RO 并行会签】→ 发布。
   法务与 RO 是同一次会签的两个节点，不是前后串行；两个节点同一阶段内并列。 */
/* 会签节点从轨迹推断（2026-11-24 标注）：BPM 审批每节点只有一个结果（通过/驳回），
   有据显示「谁 · 日期」，无据不渲染占位——v1 存量无 current.tasks，原「—」是假信息。
   node 键兼容种子 'legal'/'ro' 与 BPM 回传 taskKey 'legal_review'/'ro_review'。 */
function PublishSteps({ rec }) {
  const cur = rec.current;
  const live = rec.live;
  const archived = rec.bizState === 'draft' && rec.archived;
  const trail = cur?.trail || live?.trail || archived?.trail || [];
  const taskFromTrail = (node) =>
    [...trail].reverse().find(t => t.kind === 'bpm-task' && !t.voided && (t.node === node || t.node === `${node}_review`));
  const taskState = (node) => {
    const t = taskFromTrail(node);
    if (!t) return rec.bizState === 'pending_review' ? 'current' : 'todo';
    return t.action.includes('驳回') ? 'error' : 'done';
  };
  const taskMeta = (node) => {
    const t = taskFromTrail(node);
    if (!t) return rec.bizState === 'pending_review' ? '审阅中' : '';
    const day = (t.at || '').slice(5, 10);
    return t.action.includes('驳回') ? `驳回 · ${day}` : `${t.actor} · ${day}`;
  };
  const submit = {
    label: '提交', state: (cur || live) ? 'done' : 'current',
    // 提交节点与其余节点同口径（日期）；v1 存量从轨迹回溯，无轨迹（新建草稿）不显示
    meta: (cur?.submittedAt || (trail.find(t => t.kind === 'submit') || {}).at || '').slice(5, 10),
  };
  const publish = {
    label: '发布', state: live && (!cur || rec.bizState === 'published') ? 'done' : 'todo',
    // v2 审批中时 v1 在线不能把节点带成 done（时间倒流）
    meta: archived ? '已下架' : live && (!cur || rec.bizState === 'published') ? (live.publishedAt || '').slice(5, 10) : (rec.bizState === 'rejected' ? '未发布' : '待发布'),
  };
  const cosign = [
    { label: '法务审阅', state: taskState('legal'), meta: taskMeta('legal') },
    { label: 'RO 审阅', state: taskState('ro'), meta: taskMeta('ro') },
  ];
  return (
    <div className="special-steps pub-steps" aria-label="发布审批进度">
      <StepNode node={submit} />
      <span className={`special-step-line pub-steps-line${submit.state === 'done' ? ' special-step-line--done' : ''}`} />
      <div className="pub-steps-cosign" aria-label="法务与 RO 并行会签">
        {cosign.map(n => <StepNode key={n.label} node={n} />)}
      </div>
      <span className={`special-step-line pub-steps-line${publish.state === 'done' ? ' special-step-line--done' : ''}`} />
      <StepNode node={publish} />
    </div>
  );
}

export default function AdminPublish({ admin = null, navigate = () => {} }) {
  const [, setRefresh] = useState(0);
  const [filter, setFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { label, run }
  const [flash, setFlash] = useState(null); // { tone: 'ok'|'err', text }

  const refresh = () => setRefresh(v => v + 1);
  const isSuper = admin?.role === 'super';
  const canWithdraw = admin?.role === 'super' || admin?.role === 'ops'; // legal/ro 只读：撤回是运营动作
  const stats = getPublishStats();

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(timer);
  }, [flash]);

  /* BPM webhook 回调 → 数据层泵消费后广播，本页自动重读（工单流水与主应用同 tab 挂着等结果） */
  useEffect(() => {
    const onConsumed = () => refresh();
    window.addEventListener('zhifu-bpm-consumed', onConsumed);
    return () => window.removeEventListener('zhifu-bpm-consumed', onConsumed);
  }, []);

  const notify = (ok, text) => setFlash(ok ? { tone: 'ok', text } : { tone: 'err', text });

  const records = getPublishRecords();
  // 工单流水域：未提交审批的纯草稿不进本页；下架产生的 draft（有 archived 存证）保留——
  // 否则下架后行消失，抽屉里的「回滚上一版」不可达（2026-11-23 走查发现）
  const visibleRecords = records.filter(r => r.bizState !== 'draft' || r.archived);
  const archivedRecords = records.filter(r => r.bizState === 'draft' && r.archived);
  const stateOf = (rec) => (rec.bizState === 'draft' && rec.archived
    ? { label: '已下架', cls: 'admin-status-closed' }
    : { label: BIZ_LABELS[rec.bizState] || rec.bizState, cls: BIZ_BADGE_CLASS[rec.bizState] || 'admin-status-closed' });
  const filtered = filter === 'all' ? visibleRecords
    : filter === 'archived' ? archivedRecords
      : records.filter(r => r.bizState === filter);
  const detailRec = detailId ? records.find(r => r.id === detailId) : null;

  const openBpm = () => window.open('bpm.html', '_blank');

  /* 生成一次性预览链接（10 分钟 TTL、绑定版本）并新开预览页 */
  const openPreview = (rec) => {
    const version = rec.current || rec.live;
    if (!version) return;
    const token = createPublishPreviewToken(rec.contentType, rec.contentId, version.payloadSnapshot, version.versionId);
    const base = `${window.location.origin}${window.location.pathname}`;
    window.open(`${base}#publish-preview/${token}`, '_blank');
  };

  const runAction = (label, fn) => setConfirmAction({ label, fn });
  const doConfirmed = () => {
    if (confirmAction) {
      const res = confirmAction.fn();
      if (res && res.ok === false) notify(false, res.error || '操作失败');
      else notify(true, confirmAction.label === '撤销提交' ? '已移出审批中心，回项目/路演页重新提交' : `${confirmAction.label}完成`);
    }
    setConfirmAction(null);
    refresh();
  };

  /* 撤销提交（ops）：撤 BPM 单 → 回草稿（解锁编辑） */
  const handleWithdraw = (rec) => {
    runAction('撤销提交', () => withdrawSubmission(rec.contentType, rec.contentId, { operator: admin?.name || '运营' }));
  };
  const handleRollback = (rec) => {
    runAction('回滚上一版', () => rollbackLive(rec.contentType, rec.contentId, { operator: admin?.name || '超级管理员' }));
  };
  const handleReset = () => {
    runAction('重置演示数据', () => resetPublishDemo({ operator: admin?.name || '超级管理员' }));
  };

  const filterTabs = [
    { value: 'all', label: `全部 ${visibleRecords.length}` },
    { value: 'pending_review', label: `审批中 ${stats.pending}` },
    { value: 'rejected', label: `已驳回 ${stats.rejected}` },
    { value: 'published', label: `已发布 ${stats.published}` },
    // 已下架是「纯草稿中的下架存证」，stats.draft 混有纯草稿，须单独计数（2026-11-24 对抗性审查）
    { value: 'archived', label: `已下架 ${archivedRecords.length}` },
  ];

  const cur = detailRec?.current;
  const live = detailRec?.live;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>发布审批</h1>
        <span className="text-muted admin-header-summary">BPM 会签主审 · 审批操作请在 BPM 待办完成（详情抽屉内可打开）</span>
        {isSuper && (
          <button className="btn btn-md btn-outline" onClick={handleReset} title="重置发布审批演示数据（含 BPM 工单）">
            <RotateCcw size={15} /> 重置演示
          </button>
        )}
      </div>

      {flash && (
        <div className={`admin-form-hint ${flash.tone === 'err' ? 'admin-form-hint-warning' : ''}`}>
          {flash.text}
        </div>
      )}

      <div className="admin-filter-row">
        {filterTabs.map(f => (
          <button
            key={f.value}
            className={`admin-filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-table admin-table--publish">
        <div className="admin-table-header">
          <span className="col-name">内容</span>
          <span className="pub-col-state">状态</span>
          <span className="pub-col-time">最后更新</span>
          <span className="col-actions">操作</span>
        </div>
        {filtered.map(rec => {
          // 下架后 current/live 均被清空，标题回退到 archived 存证
          const version = rec.current || rec.live || rec.archived;
          // 操作列：每行「查看详情」icon 打开详情抽屉；审批行前置撤销提交。下架入口在项目/路演内容页（2026-11-24 用户拍板）
          const action = rec.bizState === 'pending_review' && canWithdraw
            ? { title: '撤销提交', Icon: Undo2, run: handleWithdraw }
            : null;
          return (
            <div key={rec.id} className="admin-table-row" {...{ onClick: () => setDetailId(rec.id) }}>
              <span className="col-name">
                <strong title={version?.payloadSnapshot?.title}>{version?.payloadSnapshot?.title || '—'}</strong>
              </span>
              <span className="pub-col-state">
                <span className={`status-badge ${stateOf(rec).cls}`}>{stateOf(rec).label}</span>
              </span>
              <span className="pub-col-time text-sm">{fmtTime(lastTouch(rec))}</span>
              <span className="col-actions">
                {action && (
                  <button className="btn-icon" title={action.title} aria-label={action.title} onClick={(e) => { e.stopPropagation(); action.run(rec); }}>
                    <action.Icon size={16} />
                  </button>
                )}
                <button className="btn-icon" title="查看详情" aria-label="查看详情" onClick={(e) => { e.stopPropagation(); setDetailId(rec.id); }}>
                  <Eye size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的记录</span></div>
        )}
      </div>

      {/* 详情抽屉：只读进度中心 */}
      {detailRec && (
        <>
          <div className="admin-drawer-mask" onClick={() => setDetailId(null)} />
          <div className="admin-drawer" role="dialog" aria-label={`发布审批详情：${(cur || live)?.payloadSnapshot?.title || ''}`}>
            <div className="admin-drawer-head">
              <div className="pub-drawer-heading">
                <h3 className="admin-drawer-title">{(cur || live)?.payloadSnapshot?.title || '详情'}</h3>
                <span className={`status-badge ${stateOf(detailRec).cls}`}>{stateOf(detailRec).label}</span>
              </div>
              <button className="btn-icon" title="关闭" onClick={() => setDetailId(null)}>✕</button>
            </div>
            <div className="admin-drawer-body">
              {/* 流程位置：提交 → 法务/RO 并行会签 → 发布 */}
              <PublishSteps rec={detailRec} />

              {/* 工单号：去 BPM 的跨系统定位 */}
              {cur?.bpm && (
                <div className="pub-meta-row text-muted">工单 {cur.bpm.businessId} · instanceId {cur.bpm.instanceId}</div>
              )}

              {/* 唯一一处事实轨迹：节点意见、时间、终态、发布/撤销全在这里讲一次 */}
              <div className="pub-section">
                <div className="pub-section-title">会签轨迹</div>
                <ApprovalTrail rec={detailRec} />
              </div>

              <div className="pub-actions">
                {(cur || live) && (
                  <button className="btn btn-md btn-secondary" onClick={() => openPreview(detailRec)}>
                    <Eye size={15} /> 预览（投资人视角）
                  </button>
                )}
                {detailRec.bizState === 'pending_review' && (
                  <button className="btn btn-md btn-secondary" onClick={openBpm}><ExternalLink size={15} /> 去 BPM 操作</button>
                )}
                {cur && canWithdraw && detailRec.bizState === 'pending_review' && (
                  <button className="btn btn-md btn-outline" onClick={() => handleWithdraw(detailRec)}>
                    <Undo2 size={15} /> 撤销提交
                  </button>
                )}
                {isSuper && (detailRec.prevLive || detailRec.archived) && (
                  <button className="btn btn-md btn-outline" onClick={() => handleRollback(detailRec)} title={detailRec.bizState === 'published' ? '线上版本回退到上一在线版本' : '将上一在线版本重新上线'}>
                    <RotateCcw size={15} /> 回滚上一版
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 确认弹层（回滚/撤回/重置） */}
      {confirmAction && (
        <>
          <div className="admin-drawer-mask" onClick={() => setConfirmAction(null)} />
          <div className="pub-confirm" role="alertdialog" aria-label={confirmAction.label}>
            <h4>{confirmAction.label}</h4>
            <p className="text-muted text-sm">
              {confirmAction.label === '重置演示数据'
                ? '将清空 BPM 工单/事件与发布档案，恢复到初始演示种子。'
                : `确认执行「${confirmAction.label}」？`}
            </p>
            <div className="pub-confirm-actions">
              <button className="btn btn-md btn-secondary" onClick={() => setConfirmAction(null)}>取消</button>
              <button className="btn btn-md btn-primary" onClick={doConfirmed}>确认</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
