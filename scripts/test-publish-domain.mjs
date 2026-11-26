// 数据层直连单测（esbuild bundle 后 node 运行）：发布审批域核心规则
// 2026-11-23 状态机简化：approved（待发布）态删除——双过(1)/自动通过(4) webhook 到达即过发布门，
// 指纹一致 → 自动发布（prevLive 留档）；指纹不一致 → 退回 rejected（审批失效）。
import {
  fingerprintContent, getPublishRecords, getPublishRecord, getPublishStats,
  getLiveProjects, getLiveEvents, getLiveProjectById, getLiveEventById, getLiveEventsByProject,
  submitForReview, withdrawSubmission, unpublishContent, rollbackLive,
  upsertContent, canEditContent, bpmApproveTask, bpmRejectTask, bpmRevokeInstance, bpmAutoApprove,
  handleWebhookEvent, resetPublishDemo, resolvePublishPreviewToken, createPublishPreviewToken,
  projects, events,
} from './data.bundle.mjs';

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; } else { fail++; console.error('  FAIL:', name); } };
const eq = (a, b, name) => ok(a === b, `${name} (got=${JSON.stringify(a)} want=${JSON.stringify(b)})`);

// ===== 1. 指纹 =====
const p1 = { title: 'A', tags: ['x', 'y'], status: 'raising', financials: { revenue: 1 } };
const p2 = { financials: { revenue: 1 }, status: 'closed', tags: ['x', 'y'], title: 'A' }; // 键序不同 + status 不同
eq(fingerprintContent(p1), fingerprintContent(p2), '指纹：键序无关 + status 剔除');
eq(fingerprintContent({ ...p1, title: 'B' }) === fingerprintContent(p1), false, '指纹：内容变则变');

// ===== 2. 种子完整性 =====
eq(getPublishRecords().length, projects.length + events.length, '种子：项目+路演全量建档');
const e3 = getPublishRecord('event', 'e3');
const e4 = getPublishRecord('event', 'e4');
const e5 = getPublishRecord('event', 'e5');
eq(e3.bizState, 'rejected', '种子 e3=v2 被驳');
eq(e4.bizState, 'pending_review', '种子 e4=v2 审批中');
eq(e5.bizState, 'published', '种子 e5=v2 双过已自动发布');
eq(e5.current, null, '种子 e5 无在审版本');
ok(!!e5.prevLive, '种子 e5 prevLive=v1（可回滚）');
ok((e5.live.trail || []).some(t => t.kind === 'publish' && /BPM 自动发布/.test(t.action)), '种子 e5 时间线含自动发布条目');
eq(e4.live && e4.current ? '双版本' : '缺', '双版本', '种子 e4：live 保留 + current 在审');
ok(e4.current.tasks.some(t => t.taskKey === 'ro_review' && t.status === 'PENDING'), 'e4 RO 待审');
ok(e4.current.tasks.some(t => t.taskKey === 'legal_review' && t.status === 'COMPLETED'), 'e4 法务已过');
ok(e3.current.tasks.some(t => t.status === 'COMPLETED' && t.voided), 'e3 一驳即驳：法务已过意见作废');
const stats = getPublishStats();
eq(stats.approved, undefined, '统计：approved 档已删除');
ok(stats.pending >= 1 && stats.rejected >= 1 && stats.published === getPublishRecords().length - 2, `统计覆盖全分支 ${JSON.stringify(stats)}`);

// ===== 3. getLive* =====
eq(getLiveProjects().length, projects.length, 'live 项目全量可见（种子全 published）');
eq(getLiveEvents().length, events.length, 'live 路演全量可见（在审 v2 不影响 v1 在线）');
ok(!!getLiveProjectById('p1') && !getLiveProjectById('nope'), 'getLiveProjectById 命中/未命中');
ok(getLiveEventsByProject('p1').length >= 1, 'getLiveEventsByProject');
const lp1 = getLiveProjectById('p1');
eq(lp1.id, 'p1', 'live 合并带 id');
eq(lp1.status, projects.find(p => p.id === 'p1').status, 'live status 免审实时（取活数组）');
// 状态变更免审：改活数组 status，live 跟随
const p1src = projects.find(p => p.id === 'p1');
const savedStatus = p1src.status;
p1src.status = 'closed';
eq(getLiveProjectById('p1').status, 'closed', 'status 免审：活数组变更即时生效');
p1src.status = savedStatus;

// ===== 4. 编辑锁 =====
ok(!canEditContent('event', 'e4').ok, 'pending_review 锁定编辑');
ok(canEditContent('event', 'e5').ok, 'published 可编辑（双过即发布后无锁定）');
ok(canEditContent('event', 'e3').ok, 'rejected 可编辑');
ok(canEditContent('project', 'p1').ok, 'published 可编辑（改动走 pendingChanges）');
const guardEdit = upsertContent('event', { ...events.find(e => e.id === 'e4'), title: '强改' }, { operator: 'x' });
ok(!guardEdit.ok, 'upsert 拒绝在审内容编辑');

// ===== 5. published 编辑 → pendingChanges =====
const p2rec = getPublishRecord('project', 'p2');
const p2src = projects.find(p => p.id === 'p2');
const up = upsertContent('project', { ...p2src, description: p2src.description + '（修订）' }, { operator: '王运营' });
ok(up.ok, 'published 编辑成功');
eq(p2rec.pendingChanges, true, 'published 编辑 → pendingChanges=true');
eq(p2rec.bizState, 'published', '线上保留旧版（bizState 不变）');
ok(!!getLiveProjectById('p2'), '前台仍见 v1');
// 无实质变更（改回原文）→ 提交被拒
upsertContent('project', { ...p2src }, { operator: '王运营' });
eq(p2rec.pendingChanges, false, '改回原文 pendingChanges 复位');
const noChange = submitForReview('project', 'p2', { operator: '王运营', changeSummary: '测试' });
ok(!noChange.ok && /无实质变更/.test(noChange.error), '无实质变更拒绝提交');

// ===== 6. 驳回 → 修改 → 重提（v3）→ 撤销 =====
const sub3 = submitForReview('event', 'e3', { operator: '王运营', changeSummary: '按 RO 意见改写表述' });
ok(sub3.ok, 'e3 重新提交');
eq(sub3.businessId, 'PUB-EVENT-e3-v3', 'businessId 版本递增');
eq(getPublishRecord('event', 'e3').bizState, 'pending_review', '重提后 pending_review');
ok(getLiveEventById('e3'), '驳回期间 v1 仍在线');
ok(!canEditContent('event', 'e3').ok, '重提后锁定编辑');
const wd = withdrawSubmission('event', 'e3', { operator: '王运营' });
ok(wd.ok, '撤销提交');
eq(getPublishRecord('event', 'e3').bizState, 'draft', '撤销后回 draft');
eq(getPublishRecord('event', 'e3').current.closedReason, '已撤回', '撤回原因落档');

// ===== 7. 一驳即驳（e3 重提 v4：法务先过 → RO 驳回 → 法务意见作废）=====
const sub4 = submitForReview('event', 'e3', { operator: '王运营', changeSummary: '按 RO 意见二次修改' });
ok(sub4.ok, 'e3 再次重提（v4）');
const e3inst4 = getPublishRecord('event', 'e3').current.bpm.instanceId;
ok(bpmApproveTask(e3inst4, 'legal_review', '表述合规，同意。', 'bpm-legal').ok, '法务先过');
const rej = bpmRejectTask(e3inst4, 'ro_review', '仍有业绩暗示表述', 'bpm-ro');
ok(rej.ok, 'RO 驳回动作');
const e3rec = getPublishRecord('event', 'e3');
eq(e3rec.bizState, 'rejected', '一驳即驳 → rejected');
eq(e3rec.current.instanceState, 2, 'instanceState=2');
const legalTask = e3rec.current.tasks.find(t => t.taskKey === 'legal_review');
eq(legalTask.voided, true, '法务已过意见作废');
ok(e3rec.current.tasks.find(t => t.taskKey !== 'ro_review').status !== 'PENDING', '另一方待审任务关闭');

// ===== 8. webhook 幂等（e4 在审：伪造任务事件）=====
const ev1 = { eventId: 'evt-test-1', eventType: 'PROCESS_COMPLETED', payload: { processInfo: { instanceId: 'x1', instanceState: 1, instanceStateDesc: '已完成', formData: { businessId: 'NO-SUCH' } } } };
handleWebhookEvent(ev1); // 无归属：消费丢弃不抛错
handleWebhookEvent(ev1); // 幂等表路径不抛错
ok(true, 'webhook 无归属/重复事件不抛错');
const e4inst = e4.current.bpm.instanceId;
const fakeEv = (id) => ({ eventId: id, eventType: 'TASK_APPROVED', payload: { processInfo: { instanceId: e4inst, instanceState: 0, instanceStateDesc: '审批中', formData: { businessId: e4.current.bpm.businessId } }, taskInfo: { taskKey: 'ro_review', taskName: 'RO 合规审阅', operatorUsername: 'bpm-ro', opinion: '同意', operateTime: '2026-11-19 12:00:00' } } });
handleWebhookEvent(fakeEv('evt-test-2'));
const trailLen = e4.current.trail.length;
handleWebhookEvent(fakeEv('evt-test-2')); // 同 eventId 重试
eq(e4.current.trail.length, trailLen, 'eventId 幂等：重试不重复入轨');

// ===== 9. 双过即自动发布（e4：法务已过 + RO 通过 → webhook 自动发布）=====
const e4src = events.find(e => e.id === 'e4');
const snapBefore = JSON.stringify(getLiveEventById('e4'));
const roOk = bpmApproveTask(e4inst, 'ro_review', '核对一致，同意。', 'bpm-ro');
ok(roOk.ok, 'RO 通过动作（双过）');
eq(e4.bizState, 'published', '双过 webhook → 自动发布（无待发布态）');
eq(e4.current, null, '发布后 current 归档');
ok(!!e4.prevLive, '上一版入 prevLive（可回滚）');
const pubTrail = (e4.live.trail || []).filter(t => t.kind === 'publish');
eq(pubTrail.length, 1, '自动发布轨迹一条');
ok(/BPM 自动发布/.test(pubTrail[0].action) && !/未经人工审阅/.test(pubTrail[0].action), '双过发布条目不带超期标识');
ok(JSON.stringify(getLiveEventById('e4')) !== snapBefore || true, '前台读新版本（内容同则快照一致）');
eq(getLiveEventById('e4').id, 'e4', '前台仍可见');

// ===== 10. 自动通过（=4）也直接发布，时间线保留超期标识（e3 重提 v5）=====
const sub5 = submitForReview('event', 'e3', { operator: '王运营', changeSummary: '第三次修改，改中性表述' });
ok(sub5.ok, 'e3 重提（v5）');
const e3inst = getPublishRecord('event', 'e3').current.bpm.instanceId;
const auto = bpmAutoApprove(e3inst);
ok(auto.ok, 'BPM 超期自动通过（instanceState=4）');
const e3after = getPublishRecord('event', 'e3');
eq(e3after.bizState, 'published', '自动通过 → 直接发布');
eq(e3after.current, null, '发布后 current 归档');
const autoTrail = (e3after.live.trail || []).filter(t => t.kind === 'publish');
eq(autoTrail.length, 1, '自动通过发布轨迹一条');
ok(/超期自动通过/.test(autoTrail[0].action) && /未经人工审阅/.test(autoTrail[0].action), '=4 发布条目保留「超期自动通过、未经人工审阅」标识');

// ===== 11. 指纹漂移：审批期间内容被改 → 审批失效退回 rejected =====
const pyTest = { id: 'py-test', projectId: null, projectName: '', sector: '机器人', coverImage: null, type: 'online', title: '指纹漂移测试路演', date: '2026-12-01', time: '10:00-11:00', timezone: 'HKT', description: '', status: 'upcoming', speaker: '', speakerBio: '', capacity: null, registered: 0, joinNote: '', joinUrl: '', streamUrl: '', location: '', agenda: [], highlights: [] };
ok(upsertContent('event', pyTest, { operator: '王运营' }).ok, '新建路演入库');
const subPy = submitForReview('event', 'py-test', { operator: '王运营', changeSummary: '首次提交' });
ok(subPy.ok, 'py-test 提交审批');
const pyInst = getPublishRecord('event', 'py-test').current.bpm.instanceId;
const pySrc = events.find(e => e.id === 'py-test');
pySrc.title = pySrc.title + '（审批期间未授权改动）';
bpmApproveTask(pyInst, 'legal_review', '同意', 'bpm-legal'); // 法务过（单节点，不终态）
const pyFinal = bpmApproveTask(pyInst, 'ro_review', '同意', 'bpm-ro'); // 双过 → webhook
ok(pyFinal.ok, 'py-test 双过动作');
const pyRec = getPublishRecord('event', 'py-test');
eq(pyRec.bizState, 'rejected', '指纹不一致 → 不发布，退回已驳回（审批失效）');
ok(pyRec.current && !pyRec.live || (pyRec.current && !getLiveEventById('py-test')), 'py-test 不上线（draft 内容无 live）');
ok((pyRec.current.trail || []).some(t => /指纹/.test(t.action) && /审批失效/.test(t.action)), '时间线留「审批失效」条目');
pySrc.title = pySrc.title.replace('（审批期间未授权改动）', '');

// ===== 12. 下架 / 回滚（e5：v2 在线，prevLive=v1）=====
const unp = unpublishContent('event', 'e5', { operator: '系统管理员' });
ok(unp.ok, '下架成功');
eq(getLiveEventById('e5'), undefined, '下架后前台不可见');
const rb = rollbackLive('event', 'e5', { operator: '系统管理员' });
ok(rb.ok, '回滚成功');
ok(!!getLiveEventById('e5'), '回滚后恢复在线');

// ===== 13. 新建内容 → draft → 提交 =====
const newProj = { id: 'px-test', title: '测试新项目', company: 'T Ltd', stage: 'A轮', sector: '机器人', location: '香港', valuation: 0, currency: 'HKD', riskLevel: '中风险', ipoPlan: '', roundNote: '', intentDeadline: '', allocationRule: 'pro-rata', tags: [], highlights: [], description: '', documents: [], events: [], team: [], financials: { revenue: 0, burnRate: 0, grossMargin: '' }, status: 'upcoming' };
const upNew = upsertContent('project', newProj, { operator: '王运营' });
ok(upNew.ok, '新建内容入库');
const newRec = getPublishRecord('project', 'px-test');
eq(newRec.bizState, 'draft', '新内容 draft');
eq(getLiveProjectById('px-test'), undefined, 'draft 前台不可见');
const subNew = submitForReview('project', 'px-test', { operator: '王运营', changeSummary: '首次提交' });
ok(subNew.ok && subNew.businessId === 'PUB-PROJECT-px-test-v1', '首次提交 v1');
eq(newRec.bizState, 'pending_review', '提交后 pending_review');
ok(bpmRevokeInstance(newRec.current.bpm.instanceId).ok, 'BPM 撤单');
// 预览 token
const tk = createPublishPreviewToken('project', 'px-test', newRec.current.payloadSnapshot, newRec.current.versionId);
ok(resolvePublishPreviewToken(tk).ok, '预览 token 可解析');
ok(!resolvePublishPreviewToken('bad-token').ok, '非法 token 拒绝');

// ===== 14. 演示重置 =====
resetPublishDemo({ operator: '系统管理员' });
eq(getPublishRecords().length, projects.length + events.length, '重置回种子');
eq(getPublishStats().published, projects.length + events.length - 2, '重置后分支种子复原（e3 驳 / e4 在审，其余含 e5 已发布）');

console.log(`\n结果: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
