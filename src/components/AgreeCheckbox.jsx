import { Check } from 'lucide-react';

// 协议勾选框（2026-09-15 audit P1：div onClick 勾选对键盘/读屏用户不可达）
// role=checkbox + aria-checked + Space/Enter 切换；视觉沿用 kyc-checkbox，键盘焦点环见 .agree-focus
export default function AgreeCheckbox({ checked, onToggle, className = '', style, label, children }) {
  return (
    <div
      className={`${className} agree-focus`}
      style={style}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className={`kyc-checkbox ${checked ? 'checked' : ''}`} aria-hidden="true">
        {checked && <Check size={12} />}
      </div>
      {children}
    </div>
  );
}
