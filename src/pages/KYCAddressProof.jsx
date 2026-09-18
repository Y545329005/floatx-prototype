import { useState } from "react";
import { ArrowLeft, Upload, Check, AlertCircle, Globe } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, updateKycProfile, submitKyc } from "../mock/data";

export default function KYCAddressProof({ navigate, goBack, setIsLoggedIn }) {
  const { t } = useLang();
  const profile = currentUser.kyc_profile || {};
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [addressDocType, setAddressDocType] = useState(profile.addressProofType || "utility");
  const [addressFile, setAddressFile] = useState(null);
  const [errors, setErrors] = useState({});

  // CRS/FATCA 税务居民身份字段（2026-08-26 新增：合规要求 §3.12）
  const [taxResidencies, setTaxResidencies] = useState(profile.taxResidencies || []);
  const [usPerson, setUsPerson] = useState(profile.usPerson || false);
  const [tin, setTin] = useState(profile.tin || "");
  const [crsDeclared, setCrsDeclared] = useState(profile.crsDeclared || false);

  const handleAddressUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // FileReader 转 base64 存 profile，后台审核可真实预览地址证明原件
    const reader = new FileReader();
    reader.onload = () => {
      setAddressFile({ name: file.name, size: file.size, dataUrl: reader.result });
      if (errors.address) setErrors(prev => ({ ...prev, address: null }));
    };
    reader.readAsDataURL(file);
  };

  // 税务居民地多选切换
  const toggleTaxResidency = (country) => {
    setTaxResidencies(prev => {
      const next = prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country];
      if (errors.taxResidencies) setErrors(prev2 => ({ ...prev2, taxResidencies: null }));
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!addressFile) newErrors.address = t("请上传地址证明");
    // CRS 验证（2026-08-26 新增）
    if (taxResidencies.length === 0) newErrors.taxResidencies = t("请至少选择一个税务居民地");
    if (usPerson && !tin) newErrors.tin = t("请输入美国纳税人识别号 (TIN)");
    if (!crsDeclared) newErrors.crsDeclared = t("请勾选声明");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    // 纯 CDD 提交（2026-09-15 裁决：KYC 内声明/电子签署模块移除——签署责任由注册（协议成立）/PI（认定程序）/SPV（交易签署）三节点承担）
    updateKycProfile({
      addressProofType: addressDocType,
      addressProof: addressFile,
      taxResidencies: taxResidencies,
      usPerson: usPerson,
      tin: tin,
      crsDeclared: crsDeclared,
    });
    // 提交认证（IN_PROGRESS/REJECTED → PENDING_REVIEW）
    submitKyc();
    navigate("kyc-submitted");
  };

  return (
    <div className="kyc-page">
      <div className="kyc-header">
        <div className="kyc-header-inner">
          <div style={{ width: 60 }} />  {/* 占位，保持标题居中 */}
          <span className="kyc-header-title">{t('地址证明')}</span>
          <button className="kyc-exit-btn" onClick={() => setShowExitConfirm(true)}>
            <span>{t('退出登录')}</span>
          </button>
        </div>
      </div>

      {/* 退出登录确认弹窗 */}
      {showExitConfirm && (
        <div className="sheet-mask" onClick={() => setShowExitConfirm(false)}>
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              position: 'fixed', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              background: 'var(--bg-card)', 
              borderRadius: 'var(--radius-lg)', 
              padding: 'var(--space-6)', 
              width: 'calc(100% - var(--space-8))',
              maxWidth: 320,
              zIndex: 102,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>{t('确认退出')}</h3>
            <p style={{ margin: '0 0 var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              {t('退出后认证进度将被保留，下次登录可继续。确认退出登录？')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
                {t('取消')}
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--error)', border: 'none' }} onClick={() => { setIsLoggedIn(false); navigate('login'); }}>
                {t('确认退出')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ width: '100%' }} />
          <span className="kyc-progress-dot done" style={{ left: '16.5%' }} />
          <span className="kyc-progress-dot done" style={{ left: '50%' }} />
          <span className="kyc-progress-dot active" style={{ left: '83.5%' }} />
        </div>
        <div className="kyc-progress-steps">
          <span className="kyc-progress-step done">1. {t('基本信息')}</span>
          <span className="kyc-progress-step done">2. {t('身份证件')}</span>
          <span className="kyc-progress-step active">3. {t('地址证明')}</span>
        </div>
      </div>

      <div className="kyc-content">
        {/* 地址证明卡片 */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('地址证明')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('请提供近三个月内发出的地址证明文件')}
          </div>

          {/* 证明类型 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('证明类型')}</label>
            <select
              className="kyc-form-input"
              value={addressDocType}
              onChange={e => setAddressDocType(e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
              <option value="utility">{t('水电费账单')}</option>
              <option value="bank">{t('银行月结单')}</option>
              <option value="gov">{t('政府文件')}</option>
            </select>
            <div className="kyc-form-hint">
              {t('请上传 1 份文件')}
            </div>
          </div>

          {/* 文件上传 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('上传地址证明')}</label>
            <label className={`kyc-upload-zone ${addressFile ? 'has-file' : ''} ${errors.address ? 'error' : ''}`}>
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleAddressUpload}
              />
              {addressFile ? (
                <>
                  <Check size={24} style={{ color: 'var(--success)' }} />
                  <div className="kyc-upload-file-name">{addressFile.name}</div>
                </>
              ) : (
                <>
                  <div className="kyc-upload-icon">
                    <Upload size={24} />
                  </div>
                  <div className="kyc-upload-text">{t('点击上传地址证明')}</div>
                  <div className="kyc-upload-hint">{t('支持 JPG、PNG、PDF，不超过 10MB')}</div>
                </>
              )}
            </label>
            {errors.address && <span className="kyc-form-error">{errors.address}</span>}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('文件须显示姓名及地址，且发出日期在三个月内')}
            </div>
          </div>
        </div>

        {/* CRS/FATCA 税务居民身份自我证明（2026-08-26 新增：合规要求 §3.12） */}
        <div className="kyc-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="kyc-card-title">{t('CRS/FATCA 税务居民身份自我证明')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('香港自动交换信息（AEOI）制度要求，开户必填')}
          </div>

          {/* 税务居民地（多选） */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <Globe size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('税务居民身份（可多选）')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {[
                { value: 'HK', label: t('中国香港') },
                { value: 'CN', label: t('中国大陆') },
                { value: 'US', label: t('美国') },
                { value: 'SG', label: t('新加坡') },
                { value: 'GB', label: t('英国') },
                { value: 'OTHER', label: t('其他') },
              ].map(country => (
                <button
                  key={country.value}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${taxResidencies.includes(country.value) ? 'active' : ''}`}
                  style={{
                    height: 40,
                    background: taxResidencies.includes(country.value) ? 'var(--primary)' : 'transparent',
                    color: taxResidencies.includes(country.value) ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${taxResidencies.includes(country.value) ? 'var(--primary)' : 'var(--primary-border)'}`,
                    fontSize: 'var(--text-sm)',
                  }}
                  onClick={() => toggleTaxResidency(country.value)}
                >
                  {taxResidencies.includes(country.value) && <Check size={14} style={{ marginRight: 4 }} />}
                  {country.label}
                </button>
              ))}
            </div>
            {errors.taxResidencies && <span className="kyc-form-error">{errors.taxResidencies}</span>}
          </div>

          {/* 是否美国纳税人 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('是否美国纳税人？')}</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { value: true, label: t('是') },
                { value: false, label: t('否') },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${usPerson === opt.value ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    height: 44,
                    background: usPerson === opt.value ? 'var(--primary)' : 'transparent',
                    color: usPerson === opt.value ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${usPerson === opt.value ? 'var(--primary)' : 'var(--primary-border)'}`,
                  }}
                  onClick={() => {
                    setUsPerson(opt.value);
                    if (errors.usPerson) setErrors(prev => ({ ...prev, usPerson: null }));
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 美国纳税人 TIN（仅选"是"时展开） */}
          {usPerson && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">{t('美国纳税人识别号 (TIN)')}</label>
              <input
                type="text"
                className={`kyc-form-input ${errors.tin ? 'error' : ''}`}
                placeholder={t('例如：123-45-6789')}
                value={tin}
                onChange={e => {
                  setTin(e.target.value);
                  if (errors.tin) setErrors(prev => ({ ...prev, tin: null }));
                }}
              />
              {errors.tin && <span className="kyc-form-error">{errors.tin}</span>}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('TIN 是美国国税局（IRS）分配的纳税人识别号，格式如 123-45-6789')}
                </span>
              </div>
            </div>
          )}

          {/* 声明勾选 */}
          <div
            className={`kyc-checkbox-row ${errors.crsDeclared ? 'error' : ''}`}
            onClick={() => {
              setCrsDeclared(!crsDeclared);
              if (errors.crsDeclared) setErrors(prev => ({ ...prev, crsDeclared: null }));
            }}
            style={{ cursor: 'pointer', marginTop: 'var(--space-3)' }}
          >
            <div className={`kyc-checkbox ${crsDeclared ? 'checked' : ''}`}>
              {crsDeclared && <Check size={12} />}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flex: 1 }}>
              {t('本人声明上述税务居民身份信息真实完整；如身份变化将在 30 日内通知平台')}
            </span>
          </div>
          {errors.crsDeclared && <span className="kyc-form-error" style={{ marginTop: 4 }}>{errors.crsDeclared}</span>}

          {/* 提示信息 */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('根据香港《税务条例》（第112章）及共同申报准则（CRS），您有义务提供税务居民身份信息。虚假申报可能面临法律后果。')}
            </span>
          </div>
        </div>
      </div>

      <div className="kyc-actions">
        <button
          className="kyc-btn kyc-btn-primary"
          onClick={handleSubmit}
        >
          {t('提交认证')}
        </button>
      </div>
    </div>
  );
}