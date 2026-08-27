import { useState } from 'react';
import { Briefcase, Mail, Phone, MessageCircle, ChevronRight, X } from 'lucide-react';
import { businessContact } from '../mock/data';
import { useLang } from '../i18n';

// 商务合作联系入口（对外公开，游客可见）
// 入口形态：banner（登录页 footer / 宽位）/ text（吸顶行窄位）——弹框 sheet 内容统一
// 三件套：邮箱 mailto: / 电话 tel: / WhatsApp wa.me/
// 已登录用户的服务通道由 AccountManager + Support 承担，不展示对外 BD 入口
export default function BusinessContact({ setToast, variant = 'banner', isLoggedIn = false }) {
  const { t } = useLang();
  const [showSheet, setShowSheet] = useState(false);

  if (!businessContact) return null;
  if (isLoggedIn) return null;

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast?.(label);
    } catch (e) {
      setToast?.(t('复制失败，请长按链接手动复制'));
    }
  };

  return (
    <>
      {variant === 'banner' && (
        <div className="business-contact-banner" onClick={() => setShowSheet(true)}>
          <div className="business-contact-banner-icon">
            <Briefcase size={18} />
          </div>
          <div className="business-contact-banner-info">
            <strong>{t('洽谈合作')}</strong>
            <span className="text-muted text-sm">{t('机构 · 项目 · 服务合作')}</span>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </div>
      )}

      {variant === 'text' && (
        <button
          className="contact-text-btn"
          onClick={() => setShowSheet(true)}
        >
          {t('洽谈合作')}
        </button>
      )}

      {showSheet && (
        <>
          <div className="sheet-mask" onClick={() => setShowSheet(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('洽谈合作')}</h3>
              <button className="btn-icon" onClick={() => setShowSheet(false)} aria-label="close">
                <X size={18} />
              </button>
            </div>
            <p className="text-muted text-sm sheet-sub">{t(businessContact.intro)}</p>

            <div className="business-contact-card">
              <a
                className="business-contact-row"
                href={`mailto:${businessContact.email}`}
                onClick={() => copyToClipboard(businessContact.email, t('邮箱已复制'))}
              >
                <div className="business-contact-row-icon"><Mail size={16} /></div>
                <div className="business-contact-row-info">
                  <span className="text-muted text-sm">{t('商务邮箱')}</span>
                  <strong>{businessContact.email}</strong>
                </div>
              </a>
              <a
                className="business-contact-row"
                href={`tel:${businessContact.phone.replace(/\s/g, '')}`}
                onClick={() => copyToClipboard(businessContact.phone, t('电话号码已复制'))}
              >
                <div className="business-contact-row-icon"><Phone size={16} /></div>
                <div className="business-contact-row-info">
                  <span className="text-muted text-sm">{t('商务电话')}</span>
                  <strong>{businessContact.phone}</strong>
                </div>
              </a>
              <a
                className="business-contact-row"
                href={`https://wa.me/${businessContact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="business-contact-row-icon"><MessageCircle size={16} /></div>
                <div className="business-contact-row-info">
                  <span className="text-muted text-sm">{t('商务 WhatsApp')}</span>
                  <strong>{businessContact.whatsapp}</strong>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}