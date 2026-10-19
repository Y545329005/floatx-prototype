import { useState } from 'react';
import { ArrowLeft, FileText, Building2, ShieldCheck } from 'lucide-react';
import { companyPolicies, platformBrand, resolveBrand } from '../mock/data';
import { useLang } from '../i18n';
import AgreementModal from '../components/AgreementModal';

// 公司政策文件 → 协议中心映射（2026-09-15 · 对齐协议签署实践：协议文档可点开阅读全文，不再是占位 toast）
// 2026-10-19：cp1/cp2 接入抽屉正文（company-profile / license-info），全量可读——应用市场审核要求
const POLICY_AGREEMENT_MAP = {
  cp1: 'company-profile',
  cp2: 'license-info',
  cp3: 'privacy-policy',
  cp4: 'user-agreement',
  cp5: 'risk-disclosure',
};

export default function About({ navigate, goBack, setToast }) {
  const { t } = useLang();
  const [viewingDoc, setViewingDoc] = useState(null);
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
        {companyPolicies.map(p => {
          const agreementId = POLICY_AGREEMENT_MAP[p.id];
          return (
            <a
              key={p.id}
              className="doc-item"
              href={p.file}
              onClick={e => {
                e.preventDefault();
                if (agreementId) setViewingDoc(agreementId);
                else setToast(t('文档预览即将开放'));
              }}
            >
              <FileText size={16} />
              <div className="doc-item-body">
                <span>{t(p.title)}</span>
                <span className="text-muted text-sm">{resolveBrand(t(p.subtitle))}</span>
              </div>
              <span className="text-muted text-sm">{p.date}</span>
            </a>
          );
        })}
      </div>

      <div className="about-compliance card card-secondary">
        <div className="about-compliance-row">
          <ShieldCheck size={16} className="about-compliance-icon" />
          <div>
            <strong>{platformBrand.licenseType}</strong>
            <span className="text-muted text-sm">{platformBrand.licenseDesc} · 牌照编号 CE No. {platformBrand.licenseNo}</span>
          </div>
        </div>
      </div>

      <div className="about-version">
        <span className="text-muted text-sm">版本 {platformBrand.appVersion}</span>
        <span className="text-muted text-sm">© {new Date().getFullYear()} {platformBrand.nameFullZh}</span>
      </div>

      {/* 协议全文弹窗 */}
      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
