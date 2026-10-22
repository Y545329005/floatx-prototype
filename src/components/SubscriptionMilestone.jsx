import { useLang } from '../i18n';

export default function SubscriptionMilestone({ status }) {
  const { t } = useLang();
  // 2026-10-22 RO 整改：去 SPV/配额语义——文件已提交 → 客户经理跟进 → 已完成
  const STEPS = [
    { key: 'submitted', label: t('文件已提交') },
    { key: 'allocated', label: t('客户经理跟进中') },
    { key: 'signed', label: t('已完成') },
  ];

  if (status === 'unallocated') {
    return (
      <div className="milestone-unallocated">
        {t('本轮已结束，如有进一步意向可继续提交问卷')}
      </div>
    );
  }

  const idx = STEPS.findIndex(s => s.key === status);
  const currentIdx = idx >= 0 ? idx : 0;

  return (
    <div className="milestone-steps">
      {STEPS.map((s, i) => (
        <div
          key={s.key}
          className={`milestone-step ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo'}`}
        >
          <div className="milestone-dot" />
          <span className="milestone-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
