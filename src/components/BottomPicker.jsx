import { Check, X } from 'lucide-react';
import { useLang } from '../i18n';

// 底部选择器（2026-11-04）：替代原生 <select>，对齐项目里「选卡」的交互（底部弹层 + 点选即关）。
// 原生 select 在移动端/WebView 里的展开由系统接管，桌面里就是一个小下拉面板——对客页面上会显得像网页。
// options: [{ value, label, sub?, disabled? }]
export default function BottomPicker({ open, title, options, value, onSelect, onClose }) {
  const { t } = useLang();
  if (!open) return null;

  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet picker-sheet">
        <div className="sheet-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label={t('关闭')}><X size={18} /></button>
        </div>

        <div className="picker-list">
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                className={`picker-item${active ? ' active' : ''}`}
                disabled={opt.disabled}
                onClick={() => { onSelect(opt.value); onClose(); }}
              >
                <span className="picker-item-main">
                  <span className="picker-item-label">{opt.label}</span>
                  {opt.sub && <span className="picker-item-sub">{opt.sub}</span>}
                </span>
                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
