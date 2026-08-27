import { useState } from 'react';
import { ArrowLeft, ChevronDown, Headphones, Phone } from 'lucide-react';
import { faqItems } from '../mock/data';
import { useLang } from '../i18n';

export default function Help({ navigate, goBack }) {
  const { t } = useLang();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="page help-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('帮助中心')}</h1>
        </div>
      </div>

      <div className="help-banner">
        <Headphones size={20} />
        <div>
          <strong>{t('需要人工帮助？')}</strong>
          <span className="text-muted text-sm">{t('在线客服服务时间 09:00 – 21:00')}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('#support')}>{t('联系客服')}</button>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('常见问题')}</h3>
        <div className="faq-list">
          {faqItems.map((item, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{t(item.q)}</span>
                <ChevronDown size={16} className="faq-chevron" />
              </button>
              {openIdx === i && (
                <p className="faq-answer">{t(item.a)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="help-contact">
        <Phone size={15} />
        <span className="text-muted text-sm">{t('服务热线 400-888-0000')}</span>
      </div>
    </div>
  );
}
