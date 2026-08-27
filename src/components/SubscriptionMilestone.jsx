import { useLang } from '../i18n';

export default function SubscriptionMilestone({ status }) {
  const { t } = useLang();
  const STEPS = [
    { key: 'submitted', label: t('意向已提交') },
    { key: 'allocated', label: t('已获配额') },
    { key: 'signed', label: t('已签 SPV') },
  ];

  if (status === 'unallocated') {
    return (
      <div className="milestone-unallocated">
        {t('本轮份额稀缺，未获配额，可关注后续轮次')}
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
