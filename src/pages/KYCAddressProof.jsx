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

  // B 组（2026-10-16）：POF 瘦身——就业状态 + 收入来源，风险评级最低素材
  const [employmentStatus, setEmploymentStatus] = useState(profile.employmentStatus || "");
  const [incomeSources, setIncomeSources] = useState(profile.incomeSources || []);

  // CRS/FATCA 税务居民身份字段（2026-08-26 新增；2026-10-16 C 组改造：
  // 逐地 TIN 或无 TIN 原因三选，取消「仅 US 要 TIN」特判；上限 5 个申报地）
  const [taxResidencies, setTaxResidencies] = useState(profile.taxResidencies || []);
  const [taxDetails, setTaxDetails] = useState(profile.taxDetails || {});
  const [crsDeclared, setCrsDeclared] = useState(profile.crsDeclared || false);

  const EMPLOYMENT_OPTIONS = [
    { value: 'employed', label: t('受雇') },
    { value: 'self_employed', label: t('自雇') },
    { value: 'retired', label: t('退休') },
    { value: 'other', label: t('其他') },
  ];
  const INCOME_SOURCE_OPTIONS = [
    { value: 'salary', label: t('薪金') },
    { value: 'business', label: t('经营收入') },
    { value: 'investment', label: t('投资收益') },
    { value: 'rent', label: t('租金收入') },
    { value: 'inheritance', label: t('继承或赠与') },
    { value: 'pension', label: t('退休金') },
    { value: 'other', label: t('其他') },
  ];
  const NO_TIN_REASONS = [
    { value: 'not_issued', label: t('我的税务管辖区并没有向其居民发出税务编号') },
    { value: 'not_required', label: t('税务管辖区的主管机关毋须你披露税务编号') },
    { value: 'cannot_obtain', label: t('我不能取得税务编号') },
  ];
  const TAX_RESIDENCY_MAX = 5;
  const COUNTRY_OPTIONS = [
    { value: 'HK', label: t('中国香港') },
    { value: 'CN', label: t('中国大陆') },
    { value: 'US', label: t('美国') },
    { value: 'SG', label: t('新加坡') },
    { value: 'GB', label: t('英国') },
    { value: 'OTHER', label: t('其他') },
  ];
  const countryLabel = (code) => (COUNTRY_OPTIONS.find(c => c.value === code) || {}).label || code;

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

  // 税务居民地多选切换（上限 5，CRS 申报地上限）
  const toggleTaxResidency = (country) => {
    setTaxResidencies(prev => {
      let next;
      if (prev.includes(country)) {
        next = prev.filter(c => c !== country);
      } else {
        if (prev.length >= TAX_RESIDENCY_MAX) {
          setErrors(prev2 => ({ ...prev2, taxResidencies: t("最多选择 5 个税务居民地") }));
          return prev;
        }
        next = [...prev, country];
      }
      if (errors.taxResidencies) setErrors(prev2 => ({ ...prev2, taxResidencies: null }));
      return next;
    });
  };

  // 单个申报地的 TIN 信息更新：tin 与无编号原因互斥
  const updateTaxDetail = (code, patch) => {
    setTaxDetails(prev => {
      const cur = prev[code] || { tin: "", noTinReason: "", noTinNote: "" };
      const next = { ...cur, ...patch };
      // 填 TIN 时清无编号原因；选原因时清 TIN（cannot_obtain 的说明除外）
      if (patch.tin !== undefined) { next.noTinReason = ""; next.noTinNote = ""; }
      if (patch.noTinReason !== undefined && patch.noTinReason !== 'cannot_obtain') { next.tin = ""; next.noTinNote = ""; }
      const merged = { ...prev, [code]: next };
      if (errors.taxDetails) setErrors(prev2 => ({ ...prev2, taxDetails: null }));
      return merged;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!addressFile) newErrors.address = t("请上传地址证明");
    // B 组校验
    if (!employmentStatus) newErrors.employmentStatus = t("请选择就业状态");
    if (incomeSources.length === 0) newErrors.incomeSources = t("请至少选择一项收入来源");
    // CRS 校验（C 组：每个申报地须有 TIN 或无编号原因；cannot_obtain 须说明）
    if (taxResidencies.length === 0) newErrors.taxResidencies = t("请至少选择一个税务居民地");
    const missing = taxResidencies.some(code => {
      const d = taxDetails[code] || {};
      if (d.tin) return false;
      if (!d.noTinReason) return true;
      if (d.noTinReason === 'cannot_obtain' && !(d.noTinNote || '').trim()) return true;
      return false;
    });
    if (missing) newErrors.taxDetails = t("每个税务居民地需填写税务编号或选择无编号原因");
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
      employmentStatus,
      incomeSources,
      taxResidencies: taxResidencies,
      taxDetails: taxDetails,
      crsDeclared: crsDeclared,
    });
    // 提交认证（IN_PROGRESS/REJECTED → PENDING_REVIEW）
    const ok = submitKyc();
    if (!ok) return; // 数据校验优先于 UI 反馈：入队失败不展示「审核中」页
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
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { setIsLoggedIn(false); navigate('login'); }}>
                {t('确认退出')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ '--fill': 1 }} />
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
              <option value="gov">{t('其他带姓名及地址的文件')}</option>
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

        {/* 财务信息卡（B 组 · POF 瘦身：就业状态 + 收入来源，风险评级最低素材） */}
        <div className="kyc-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="kyc-card-title">{t('财务信息')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('用于客户风险评级，信息仅用于合规审查')}
          </div>

          {/* 就业状态 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('就业状态')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {EMPLOYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${employmentStatus === opt.value ? 'active' : ''}`}
                  style={{
                    height: 40,
                    background: employmentStatus === opt.value ? 'var(--primary)' : 'transparent',
                    color: employmentStatus === opt.value ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${employmentStatus === opt.value ? 'var(--primary)' : 'var(--primary-border)'}`,
                    fontSize: 'var(--text-sm)',
                  }}
                  onClick={() => {
                    setEmploymentStatus(opt.value);
                    if (errors.employmentStatus) setErrors(prev => ({ ...prev, employmentStatus: null }));
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.employmentStatus && <span className="kyc-form-error">{errors.employmentStatus}</span>}
          </div>

          {/* 收入来源（多选） */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('收入来源（可多选）')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {INCOME_SOURCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${incomeSources.includes(opt.value) ? 'active' : ''}`}
                  style={{
                    height: 40,
                    background: incomeSources.includes(opt.value) ? 'var(--primary)' : 'transparent',
                    color: incomeSources.includes(opt.value) ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${incomeSources.includes(opt.value) ? 'var(--primary)' : 'var(--primary-border)'}`,
                    fontSize: 'var(--text-sm)',
                  }}
                  onClick={() => {
                    setIncomeSources(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]);
                    if (errors.incomeSources) setErrors(prev => ({ ...prev, incomeSources: null }));
                  }}
                >
                  {incomeSources.includes(opt.value) && <Check size={14} style={{ marginRight: 4 }} />}
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.incomeSources && <span className="kyc-form-error">{errors.incomeSources}</span>}
          </div>
        </div>

        {/* CRS/FATCA 税务居民身份自我证明（2026-08-26 新增；2026-10-16 C 组：逐地 TIN/无编号原因，上限 5 地） */}
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
              {COUNTRY_OPTIONS.map(country => (
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
            <div className="kyc-form-hint">{t('最多选择 5 个')} · {taxResidencies.length}/5</div>
          </div>

          {/* 逐地税务编号 / 无编号原因（C 组：取消仅 US 特判，每个申报地同一逻辑） */}
          {taxResidencies.length > 0 && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">{t('税务编号（TIN）')}</label>
              {taxResidencies.map(code => {
                const d = taxDetails[code] || { tin: "", noTinReason: "", noTinNote: "" };
                return (
                  <div key={code} style={{ padding: 'var(--space-3)', background: 'var(--muted)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{countryLabel(code)}</div>
                    <input
                      type="text"
                      className="kyc-form-input"
                      placeholder={t('输入税务编号')}
                      value={d.tin}
                      onChange={e => updateTaxDetail(code, { tin: e.target.value })}
                    />
                    <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 'var(--space-2) 0' }}>{t('或')}</div>
                    <select
                      className="kyc-form-input"
                      style={{ appearance: 'none', cursor: 'pointer' }}
                      value={d.noTinReason}
                      onChange={e => updateTaxDetail(code, { noTinReason: e.target.value })}
                    >
                      <option value="">{t('无税务编号？选择原因')}</option>
                      {NO_TIN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {d.noTinReason === 'cannot_obtain' && (
                      <input
                        type="text"
                        className="kyc-form-input"
                        style={{ marginTop: 'var(--space-2)' }}
                        placeholder={t('请说明不能取得的原因')}
                        value={d.noTinNote}
                        onChange={e => updateTaxDetail(code, { noTinNote: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}
              {errors.taxDetails && <span className="kyc-form-error">{errors.taxDetails}</span>}
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