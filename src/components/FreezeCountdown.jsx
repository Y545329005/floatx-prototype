import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLang } from '../i18n';

export default function FreezeCountdown({ deadline }) {
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  if (!deadline) return null;
  const target = new Date(String(deadline).replace(/-/g, '/')).getTime();
  const diff = target - now;
  if (diff <= 0) return <span className="freeze-countdown expired">{t('宽限期已过')}</span>;
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    <span className="freeze-countdown">
      <Clock size={12} />
      {h > 0 && <span>{h}{t('小时')}</span>}
      <span>{m}{t('分')}</span>
      <span>{s}{t('秒')}</span>
    </span>
  );
}