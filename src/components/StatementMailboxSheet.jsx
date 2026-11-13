import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { setStatementMailbox, statementMailboxOf } from '../mock/data';
import { useLang } from '../i18n';

/* 设置结单接收邮箱（2026-11-12）
   结单、回单、邮件预览三处共用——同一件事只写一遍，校验与文案才不会各说各话。
   结单要发到客户长期可查的地址，所以不和登录邮箱绑死。 */
export default function StatementMailboxSheet({ open, onClose, onSaved }) {
  const { t } = useLang();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(statementMailboxOf());
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    const res = setStatementMailbox(draft);
    if (!res.ok) {
      setError(t(res.error));
      return;
    }
    // 先关邮箱弹层、再执行调用方的后续动作：调用方会在 onSaved 里接着弹「申请回执」，
    // 顺序反过来会把刚打开的弹层立刻关掉。
    onClose();
    if (onSaved) onSaved(res.email);
  };

  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('设置接收邮箱')}>
        <div className="sheet-header">
          <h3>{t('设置接收邮箱')}</h3>
          <button className="btn-icon" onClick={onClose} aria-label={t('关闭')}><X size={18} /></button>
        </div>
        <p className="sheet-sub text-muted">{t('结单将发送到此邮箱，可随时修改。')}</p>
        <div className="form-group">
          <label className="form-label" htmlFor="statement-mailbox">{t('接收邮箱')}</label>
          <input
            id="statement-mailbox"
            className="form-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <button className="btn btn-primary btn-full sheet-submit" onClick={save}>{t('保存')}</button>
      </div>
    </>
  );
}
