import { ArrowLeft, FileText, Download, Eye } from 'lucide-react';
import { reports } from '../mock/data';
import { useLang } from '../i18n';

export default function Reports({ navigate, goBack, setToast }) {
  const { t } = useLang();
  return (
    <div className="page reports-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('合规报告')}</h1>
        </div>
      </div>

      <div className="reports-note card">
        <p className="text-muted text-sm">
          {t('根据香港证监会（SFC）相关规定，持牌机构需定期向专业投资者提供资产报告及合规披露文件。')}
        </p>
      </div>

      {reports.map(r => (
        <div key={r.id} className="card report-card">
          <div className="report-card-left">
            <FileText size={20} />
          </div>
          <div className="report-card-body">
            <h4>{r.name}</h4>
            <div className="report-meta">
              <span>{r.type}</span>
              <span>{r.date}</span>
              <span>{r.size}</span>
            </div>
          </div>
          <div className="report-card-actions">
            <button className="btn-icon" onClick={() => setToast(t('报告预览即将开放'))}><Eye size={16} /></button>
            <button className="btn-icon" onClick={() => setToast(t('下载功能即将开放'))}><Download size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
