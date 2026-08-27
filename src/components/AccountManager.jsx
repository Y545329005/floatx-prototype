import { useState } from 'react';
import { Phone, Mail, MessageCircle, Headphones, ChevronRight, X } from 'lucide-react';
import { currentUser } from '../mock/data';
import { useLang } from '../i18n';

function AccountManagerCard({ onEscalate }) {
  const { t } = useLang();
  const am = currentUser.accountManager;
  if (!am) return null;

  return (
    <div className="account-manager-card">
      <div className="account-manager-head">
        <div className="account-manager-avatar">{am.name[0]}</div>
        <div className="account-manager-info">
          <strong>{am.name}</strong>
          <span className="text-muted text-sm">{am.role} · {t('全程为您服务')}</span>
        </div>
      </div>
      <div className="account-manager-contacts">
        <a className="account-manager-contact" href={`tel:${am.phone.replace(/\s/g, '')}`}>
          <Phone size={15} />
          <span>{am.phone}</span>
        </a>
        <a className="account-manager-contact" href={`mailto:${am.email}`}>
          <Mail size={15} />
          <span>{am.email}</span>
        </a>
        <div className="account-manager-contact">
          <MessageCircle size={15} />
          <span>{am.imType} {am.im}</span>
        </div>
      </div>
      <button className="account-manager-escalate" onClick={onEscalate}>
        <Headphones size={14} />
        {t('对接人未响应？转在线客服')}
      </button>
    </div>
  );
}

export default function AccountManager({ onEscalate, compact }) {
  const { t } = useLang();
  const [showSheet, setShowSheet] = useState(false);
  const am = currentUser.accountManager;
  if (!am) return null;

  if (compact) {
    return (
      <>
        <div className="account-manager-row" onClick={() => setShowSheet(true)}>
          <div className="account-manager-row-icon">
            <Headphones size={18} />
          </div>
          <div className="account-manager-row-info">
            <strong>{am.name}</strong>
            <span className="text-muted text-sm">{am.role}</span>
          </div>
          <span className="account-manager-row-hint text-muted text-sm">{t('联系专属经理')}</span>
          <ChevronRight size={16} className="text-muted" />
        </div>
        {showSheet && (
          <>
            <div className="sheet-mask" onClick={() => setShowSheet(false)} />
            <div className="sheet">
              <div className="sheet-header">
                <h3>{t('您的专属顾问')}</h3>
                <button className="btn-icon" onClick={() => setShowSheet(false)}><X size={18} /></button>
              </div>
              <p className="text-muted text-sm sheet-sub">{t('关于投资事宜的任何疑问，可直接联系您的客户经理')}</p>
              <AccountManagerCard onEscalate={onEscalate} />
            </div>
          </>
        )}
      </>
    );
  }

  return <AccountManagerCard onEscalate={onEscalate} />;
}
