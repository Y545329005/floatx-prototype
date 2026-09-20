import { useState } from "react";
import { ArrowLeft, ShieldCheck, Upload, Check, AlertCircle, Briefcase } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, submitPiCertification, recordAgreement } from "../mock/data";
import AgreementModal from "../components/AgreementModal";

export default function KYCPI({ navigate, goBack }) {
  const { t } = useLang();
  const profile = currentUser.kyc_profile || {};

  const [formData, setFormData] = useState({
    // 默认「资产达标」（2026-09-20 拍板）：首屏激活/未激活对比强化二选一感知，消除空态错误路径；
    // 选错路径在下一步即时暴露（上传区 vs 持牌表单），1 次点击切换；重新提交时回读已有类型
    pi_type: profile.piType || "asset",
    pi_license_no: profile.piLicenseNo || "",
    pi_license_org: profile.piLicenseOrg || "",
    pi_certified: profile.piCertified || false,
  });
  const [piFile, setPiFile] = useState(profile.piProof ? { name: profile.piProof } : null);
  const [errors, setErrors] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null); // PI 条款文档弹窗（2026-09-15）

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handlePiFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 2026-08-14：FileReader 转 base64 存 dataUrl——后台 PI 审核需真实预览资产证明（对齐 KYC 证件预览）
      const reader = new FileReader();
      reader.onload = () => {
        setPiFile({ name: file.name, size: file.size, dataUrl: reader.result });
        if (errors.pi_file) setErrors(prev => ({ ...prev, pi_file: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.pi_type) newErrors.pi_type = t("请选择专业投资者资格类型");
    if (formData.pi_type === 'asset' && !piFile) newErrors.pi_file = t("请上传资产证明文件");
    // 2026-09-20：持牌类型凭 CE No. 走 SFC 公开记录核验，编号与机构名称必填
    if (formData.pi_type === 'professional') {
      if (!formData.pi_license_no.trim()) newErrors.pi_license_no = t("请填写持牌编号（CE No.）");
      if (!formData.pi_license_org.trim()) newErrors.pi_license_org = t("请填写持牌机构名称");
    }
    if (!formData.pi_certified) newErrors.pi_certified = t("请阅读并同意签署专业投资者声明");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    // 2026-08-14：独立 PI 审核流——提交进入待审核队列（不再自我声明即生效），后台核验通过才 isPI=true
    const res = submitPiCertification({
      piType: formData.pi_type,
      piProof: piFile,
      piCertified: formData.pi_certified,
      piLicenseNo: formData.pi_type === 'professional' ? formData.pi_license_no.trim() : null,
      piLicenseOrg: formData.pi_type === 'professional' ? formData.pi_license_org.trim() : null,
    });
    // PI 声明签署留痕（2026-09-15 · 对齐公司实践场景④：声明版本 + 时间固化）
    if (res.ok) {
      recordAgreement({ type: 'pi', agreementIds: ['pi-terms', 'privacy-policy', 'pi-declaration'] });
      navigate('pi-submitted');
    }
  };

  return (
    <div className="kyc-page">
      {/* 吸顶标题栏 */}
      <div className="kyc-header">
        <div className="kyc-header-inner">
          <button className="kyc-back-btn" onClick={goBack}>
            <ArrowLeft size={20} />
            <span>{t('返回')}</span>
          </button>
          <span className="kyc-header-title">{t('专业投资者资格声明')}</span>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div className="kyc-content">
        {/* 时间预估 */}
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <ShieldCheck size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('预计完成时间：1-2 分钟')}
          </span>
        </div>

        {/* 专业投资者资格声明 */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('专业投资者资格声明')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('根据香港证监会规定，专业投资者需满足以下条件之一：')}
          </div>

          {/* PI 类型选择 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('资格类型')}</label>
            {/* 单选选项卡（2026-09-20 · token 合规化抽类：原内联 style 违反反模式 #10 / height 52 / gap 2 / opacity 0.8） */}
            <div className="kyc-pi-type-group">
              {[
                { value: 'asset', label: t('资产达标'), desc: t('持有 HK$800 万以上投资组合') },
                { value: 'professional', label: t('专业投资者'), desc: t('持牌人士或注册机构') },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`kyc-pi-type ${formData.pi_type === opt.value ? 'active' : ''}`}
                  onClick={() => update('pi_type', opt.value)}
                >
                  <span className="kyc-pi-type-label">{opt.label}</span>
                  <span className="kyc-pi-type-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            {errors.pi_type && <span className="kyc-form-error">{errors.pi_type}</span>}
          </div>

          {/* 资产证明上传（仅资产达标类型） */}
          {formData.pi_type === 'asset' && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">
                <Briefcase size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {t('资产证明文件')}
              </label>
              <label className={`kyc-upload-zone ${piFile ? 'has-file' : ''} ${errors.pi_file ? 'error' : ''}`}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handlePiFileUpload}
                />
                {piFile ? (
                  <>
                    <Check size={24} style={{ color: 'var(--success)' }} />
                    <div className="kyc-upload-file-name">{piFile.name}</div>
                  </>
                ) : (
                  <>
                    <div className="kyc-upload-icon">
                      <Upload size={24} />
                    </div>
                    <div className="kyc-upload-text">{t('点击上传资产证明')}</div>
                    <div className="kyc-upload-hint">{t('银行月结单或投资组合账单（不超过 10MB）')}</div>
                  </>
                )}
              </label>
              {errors.pi_file && <span className="kyc-form-error">{errors.pi_file}</span>}
            </div>
          )}

          {/* 持牌信息（2026-09-20：professional 类型凭 CE No. 走 SFC 公开记录核验，无需上传文件） */}
          {formData.pi_type === 'professional' && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">{t('持牌信息')}</label>
              <input
                type="text"
                className={`kyc-form-input ${errors.pi_license_no ? 'error' : ''}`}
                placeholder={t('请输入 SFC 中央编号（如：ABC123）')}
                value={formData.pi_license_no}
                onChange={(e) => update('pi_license_no', e.target.value)}
              />
              {errors.pi_license_no && <span className="kyc-form-error">{errors.pi_license_no}</span>}
              <input
                type="text"
                className={`kyc-form-input ${errors.pi_license_org ? 'error' : ''}`}
                style={{ marginTop: 'var(--space-2)' }}
                placeholder={t('持牌机构名称')}
                value={formData.pi_license_org}
                onChange={(e) => update('pi_license_org', e.target.value)}
              />
              {errors.pi_license_org && <span className="kyc-form-error">{errors.pi_license_org}</span>}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                {t('后台将凭中央编号在香港证监会公开记录核验您的持牌资格，无需上传文件')}
              </div>
            </div>
          )}

          {/* 声明签署（2026-09-15 · 对齐公司实践场景④：完整法律声明全文 + 条款文档链接 + 勾选确认） */}
          <div className="kyc-card" style={{ marginTop: 'var(--space-3)' }}>
            <div className="kyc-card-title">{t('专业投资者声明')}</div>
            <p className="kyc-card-desc" style={{ marginBottom: 'var(--space-2)' }}>
              {t('请认真阅读以下协议文件，并确认下方声明：')}
            </p>
            {/* 2026-09-20：声明全文收进抽屉（pi-declaration），三份文件同一交互；页面不留内容预览 */}
            <div className="kyc-agreement-links">
              <button type="button" className="kyc-agreement-link" onClick={() => setViewingDoc('pi-terms')}>
                {t('《专业投资者业务条款及风险披露声明书》')} ›
              </button>
              <button type="button" className="kyc-agreement-link" onClick={() => setViewingDoc('privacy-policy')}>
                {t('《私隐政策》')} ›
              </button>
              <button type="button" className="kyc-agreement-link" onClick={() => setViewingDoc('pi-declaration')}>
                {t('《专业投资者声明》')} ›
              </button>
            </div>
          </div>

          <div
            className={`kyc-checkbox-row ${errors.pi_certified ? 'error' : ''}`}
            onClick={() => update('pi_certified', !formData.pi_certified)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`kyc-checkbox ${formData.pi_certified ? 'checked' : ''}`}>
              {formData.pi_certified && <Check size={12} />}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flex: 1 }}>
              {t('本人已阅读并同意上述声明，确认签署专业投资者声明')}
            </span>
          </div>
          {errors.pi_certified && <span className="kyc-form-error" style={{ marginTop: 4 }}>{errors.pi_certified}</span>}

          {/* 法规提示按所选类型聚焦（2026-09-20：持牌类型收 CE No. 后，避免误导其去准备资产证明） */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {formData.pi_type === 'asset'
                ? t('《证券及期货条例》附表1定义的专业投资者，您需持有至少 HK$8,000,000 的投资组合')
                : formData.pi_type === 'professional'
                  ? t('《证券及期货条例》附表1定义的专业投资者，持牌资格将凭 SFC 中央编号在证监会公开记录核验')
                  : t('《证券及期货条例》附表1定义的专业投资者，您需持有至少 HK$8,000,000 的投资组合或为持牌人士')}
            </span>
          </div>
        </div>
      </div>

      <div className="kyc-actions">
        <button className="kyc-btn kyc-btn-primary" onClick={handleSubmit}>
          {t('确认提交')}
        </button>
      </div>

      {/* PI 条款文档弹窗 */}
      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
