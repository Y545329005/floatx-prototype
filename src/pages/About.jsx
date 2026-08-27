import { ArrowLeft, FileText, Building2, ShieldCheck } from 'lucide-react';
import { companyPolicies, platformBrand } from '../mock/data';
import { useLang } from '../i18n';

export default function About({ navigate, goBack, setToast }) {
  const { t } = useLang();
  return (
    <div className="page about-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('关于')}</h1>
        </div>
      </div>

      <div className="about-brand card">
        <div className="about-logo">
          <Building2 size={22} />
        </div>
        <div className="about-brand-info">
          <strong>{platformBrand.nameFullZh}</strong>
          <span className="text-muted text-sm">{platformBrand.nameEn}</span>
        </div>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('公司政策文件')}</h3>
        {companyPolicies.map(p => (
          <a key={p.id} className="doc-item" href={p.file} onClick={e => { e.preventDefault(); setToast(t('文档预览即将开放')); }}>
            <FileText size={16} />
            <div className="doc-item-body">
              <span>{p.title}</span>
              <span className="text-muted text-sm">{p.subtitle}</span>
            </div>
            <span className="text-muted text-sm">{p.date}</span>
          </a>
        ))}
      </div>

      <div className="about-compliance card card-secondary">
        <div className="about-compliance-row">
          <ShieldCheck size={16} className="about-compliance-icon" />
          <div>
            <strong>香港证监会第 9 类牌照</strong>
            <span className="text-muted text-sm">就资产管理提供意见 · 牌照编号 CE No. {platformBrand.licenseNo}</span>
          </div>
        </div>
      </div>

      <div className="about-version">
        <span className="text-muted text-sm">版本 2.0.0</span>
        <span className="text-muted text-sm">© 2026 {platformBrand.nameFullZh}</span>
      </div>
    </div>
  );
}
