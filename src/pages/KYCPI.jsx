import { useState } from "react";
import { ArrowLeft, ShieldCheck, Upload, Check, AlertCircle, Briefcase } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, submitPiCertification } from "../mock/data";

export default function KYCPI({ navigate, goBack }) {
  const { t } = useLang();
  const profile = currentUser.kyc_profile || {};

  const [formData, setFormData] = useState({
    pi_type: profile.piType || "",
    pi_certified: profile.piCertified || false,
  });
  const [piFile, setPiFile] = useState(profile.piProof ? { name: profile.piProof } : null);
  const [errors, setErrors] = useState({});

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
    });
    if (res.ok) {
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
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { value: 'asset', label: t('资产达标'), desc: t('持有 HK$800 万以上投资组合') },
                { value: 'professional', label: t('专业投资者'), desc: t('持牌人士或注册机构') },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${formData.pi_type === opt.value ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    height: 52,
                    background: formData.pi_type === opt.value ? 'var(--primary)' : 'transparent',
                    color: formData.pi_type === opt.value ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${formData.pi_type === opt.value ? 'var(--primary)' : 'var(--primary-border)'}`,
                    fontSize: 'var(--text-sm)',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  onClick={() => update('pi_type', opt.value)}
                >
                  <span style={{ fontWeight: 600 }}>{opt.label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>{opt.desc}</span>
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

          {/* 声明签署 */}
          <div
            className={`kyc-checkbox-row ${errors.pi_certified ? 'error' : ''}`}
            onClick={() => update('pi_certified', !formData.pi_certified)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`kyc-checkbox ${formData.pi_certified ? 'checked' : ''}`}>
              {formData.pi_certified && <Check size={12} />}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flex: 1 }}>
              {t('我确认上述信息真实有效，并同意签署专业投资者声明')}
            </span>
          </div>
          {errors.pi_certified && <span className="kyc-form-error" style={{ marginTop: 4 }}>{errors.pi_certified}</span>}

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('《证券及期货条例》附表1定义的专业投资者，您需持有至少 HK$8,000,000 的投资组合或为持牌人士')}
            </span>
          </div>
        </div>
      </div>

      <div className="kyc-actions">
        <button className="kyc-btn kyc-btn-primary" onClick={handleSubmit}>
          {t('确认提交')}
        </button>
      </div>
    </div>
  );
}
