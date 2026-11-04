import { useState } from "react";
import { ArrowLeft, ShieldCheck, User, Calendar, Globe, ChevronDown, X, AlertCircle } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, updateKycProfile } from "../mock/data";
import BottomPicker from "../components/BottomPicker";
import DateWheelPicker from "../components/DateWheelPicker";

export default function KYCStart({ navigate, goBack, setIsLoggedIn }) {
  const { t, lang } = useLang();
  const profile = currentUser.kyc_profile || {};
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [picker, setPicker] = useState(null);   // 'nationality' | 'pepPosition'

  // 选择类字段统一底部弹层（2026-11-05：原生 select 是网页语言，APP 用 BottomPicker）
  const NATIONALITY_OPTIONS = [
    { value: 'HK', label: t('中国香港') },
    { value: 'CN', label: t('中国大陆') },
    { value: 'MO', label: t('中国澳门') },
    { value: 'TW', label: t('中国台湾') },
    { value: 'GB', label: t('英国') },
    { value: 'US', label: t('美国') },
    { value: 'SG', label: t('新加坡') },
    { value: 'OTHER', label: t('其他') },
  ];
  const PEP_POSITION_OPTIONS = [
    { value: 'political', label: t('政治人物') },
    { value: 'government', label: t('政府官员') },
    { value: 'soe_executive', label: t('国有企业高管') },
    { value: 'intl_org', label: t('国际组织负责人') },
    { value: 'other', label: t('其他') },
  ];

  // E1（2026-10-16）：英文姓名拆姓氏/名字两框；旧数据只有 name_en 时按首空格拆（香港习惯姓在前，如 CHAN Tai Man）
  const legacyName = profile.name_en || "";
  const [formData, setFormData] = useState({
    name_en_last: profile.name_en_last || (legacyName ? legacyName.split(/\s+/)[0] : ""),
    name_en_first: profile.name_en_first || (legacyName ? legacyName.split(/\s+/).slice(1).join(" ") : ""),
    name_cn: profile.name_cn || "",
    gender: profile.gender || "",
    nationality: profile.nationality || "",
    birth_date: profile.birthDate || "",
    // PEP声明字段（2026-08-26 新增：合规要求 §3.15.2）
    pep_declared: profile.pepDeclared || "",   // 'yes' | 'no' | ''
    pep_position_type: profile.pepPositionType || "",   // 职务类型
    pep_organization: profile.pepOrganization || "",    // 所在机构
    pep_tenure: profile.pepTenure || "",               // 任职时间
  });
const [errors, setErrors] = useState({});
 const [showDateSheet, setShowDateSheet] = useState(false);

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name_en_last) newErrors.name_en_last = t("请输入英文姓氏");
    if (!formData.name_en_first) newErrors.name_en_first = t("请输入英文名字");
    if (!formData.name_cn) newErrors.name_cn = t("请输入中文姓名");
    if (!formData.gender) newErrors.gender = t("请选择性别");
    if (!formData.nationality) newErrors.nationality = t("请选择国籍");
    if (!formData.birth_date) newErrors.birth_date = t("请输入出生日期");
    // PEP声明验证（2026-08-26 新增）
    if (!formData.pep_declared) newErrors.pep_declared = t("请选择是否为政治敏感人物");
    if (formData.pep_declared === 'yes') {
      if (!formData.pep_position_type) newErrors.pep_position_type = t("请选择职务类型");
      if (!formData.pep_organization) newErrors.pep_organization = t("请输入所在机构");
      if (!formData.pep_tenure) newErrors.pep_tenure = t("请输入任职时间");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const nameEn = `${formData.name_en_last} ${formData.name_en_first}`.trim();
    updateKycProfile({
      name_en_last: formData.name_en_last,
      name_en_first: formData.name_en_first,
      name_en: nameEn,
      name_cn: formData.name_cn,
      // 同步后台展示字段：submitKyc 快照读 fullName/fullNameEn，此前表单从不写这两个键，
      // 新用户走完流程后台英文名/中文名恒为空（快照白名单错位，随 E1/E2 一并闭合）
      fullName: formData.name_cn,
      fullNameEn: nameEn,
      gender: formData.gender,
      nationality: formData.nationality,
      birthDate: formData.birth_date,
      // PEP声明数据（2026-08-26 新增）
      pepDeclared: formData.pep_declared,
      pepPositionType: formData.pep_position_type,
      pepOrganization: formData.pep_organization,
      pepTenure: formData.pep_tenure,
    });
    navigate("kyc-id-upload");
  };

  return (
    <div className="kyc-page">
      {/* 吸顶标题栏 */}
      <div className="kyc-header">
        <div className="kyc-header-inner">
          <div style={{ width: 60 }} />  {/* 占位，保持标题居中 */}
          <span className="kyc-header-title">{t('实名认证')}</span>
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

      {/* 进度条（2026-09-15 收敛为 3 步：基本信息 → 身份证件 → 地址证明；KYC 内签署模块已移除） */}
      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ '--fill': 0.125 }} />
          <span className="kyc-progress-dot active" style={{ left: '12.5%' }} />
          <span className="kyc-progress-dot" style={{ left: '37.5%' }} />
          <span className="kyc-progress-dot" style={{ left: '62.5%' }} />
          <span className="kyc-progress-dot" style={{ left: '87.5%' }} />
        </div>
        <div className="kyc-progress-steps">
          <span className="kyc-progress-step active">1. {t('基本信息')}</span>
          <span className="kyc-progress-step">2. {t('身份证件')}</span>
          <span className="kyc-progress-step">3. {t('地址证明')}</span>
          <span className="kyc-progress-step">4. {t('银行转账认证')}</span>
        </div>
      </div>

      <div className="kyc-content">
        {/* 时间预估 */}
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <ShieldCheck size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('预计完成时间：5-10 分钟')}
          </span>
        </div>

        {/* 基本信息 */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('基本信息')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('请确保姓名与证件上的信息一致')}
          </div>

          {/* 英文姓名（E1：姓氏/名字分开，与证件一致） */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <User size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('英文姓名（与证件一致）')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <div>
                <input
                  type="text"
                  className={`kyc-form-input ${errors.name_en_last ? 'error' : ''}`}
                  placeholder={t('姓氏，如 CHAN')}
                  value={formData.name_en_last}
                  onChange={e => update('name_en_last', e.target.value)}
                />
                {errors.name_en_last && <span className="kyc-form-error">{errors.name_en_last}</span>}
              </div>
              <div>
                <input
                  type="text"
                  className={`kyc-form-input ${errors.name_en_first ? 'error' : ''}`}
                  placeholder={t('名字，如 Tai Man')}
                  value={formData.name_en_first}
                  onChange={e => update('name_en_first', e.target.value)}
                />
                {errors.name_en_first && <span className="kyc-form-error">{errors.name_en_first}</span>}
              </div>
            </div>
          </div>

          {/* 中文姓名（E2：改必填） */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('中文姓名')}</label>
            <input
              type="text"
              className={`kyc-form-input ${errors.name_cn ? 'error' : ''}`}
              placeholder={t('例如：陈大文')}
              value={formData.name_cn}
              onChange={e => update('name_cn', e.target.value)}
            />
            {errors.name_cn && <span className="kyc-form-error">{errors.name_cn}</span>}
          </div>

          {/* 性别 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('性别')}</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {['M', 'F'].map(g => (
                <button
                  key={g}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${formData.gender === g ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    height: 44,
                    background: formData.gender === g ? 'var(--primary)' : 'transparent',
                    color: formData.gender === g ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${formData.gender === g ? 'var(--primary)' : 'var(--primary-border)'}`,
                  }}
                  onClick={() => update('gender', g)}
                >
                  {g === 'M' ? t('男') : t('女')}
                </button>
              ))}
            </div>
            {errors.gender && <span className="kyc-form-error">{errors.gender}</span>}
          </div>

          {/* 国籍 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <Globe size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('国籍')}
            </label>
            <button
              type="button"
              className={`kyc-form-input picker-trigger ${errors.nationality ? 'error' : ''}`}
              onClick={() => setPicker('nationality')}
            >
              <span
                className="picker-trigger-value"
                style={formData.nationality ? undefined : { color: 'var(--text-muted)' }}
              >
                {formData.nationality
                  ? (NATIONALITY_OPTIONS.find(o => o.value === formData.nationality) || {}).label
                  : t('请选择国籍')}
              </span>
              <ChevronDown size={18} className="picker-caret" />
            </button>
            {errors.nationality && <span className="kyc-form-error">{errors.nationality}</span>}
          </div>

          {/* 出生日期 - iOS 紧凑模式 button + sheet */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('出生日期')}
            </label>
            <button
              type="button"
              className={`kyc-form-input kyc-date-button ${errors.birth_date ? 'error' : ''}`}
              onClick={() => setShowDateSheet(true)}
            >
              <span className={formData.birth_date ? 'kyc-date-value' : 'kyc-date-placeholder'}>
                {formData.birth_date ? formData.birth_date.replace(/-/g, '/') : t('选择出生日期')}
              </span>
              <ChevronDown size={18} className="kyc-date-chevron" />
            </button>
            {errors.birth_date && <span className="kyc-form-error">{errors.birth_date}</span>}
          </div>
        </div>

        {/* PEP声明区块（2026-08-26 新增：合规要求 §3.15.2） */}
        <div className="kyc-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="kyc-card-title">{t('政治敏感人物声明')}</div>
          <div className="kyc-card-desc" style={{ marginBottom: 'var(--space-3)' }}>
            {t('根据监管要求，请确认以下信息')}
          </div>

          {/* PEP声明问题 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <AlertCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('您是否担任或曾担任以下职务：政治人物、政府官员、国有企业高管、国际组织负责人？')}
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { value: 'yes', label: t('是') },
                { value: 'no', label: t('否') },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`kyc-btn kyc-btn-secondary ${formData.pep_declared === opt.value ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    height: 44,
                    background: formData.pep_declared === opt.value ? 'var(--primary)' : 'transparent',
                    color: formData.pep_declared === opt.value ? 'var(--text-on-dark)' : 'var(--primary)',
                    border: `1px solid ${formData.pep_declared === opt.value ? 'var(--primary)' : 'var(--primary-border)'}`,
                  }}
                  onClick={() => update('pep_declared', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.pep_declared && <span className="kyc-form-error">{errors.pep_declared}</span>}
          </div>

          {/* PEP附加字段（仅选"是"时展开） */}
          {formData.pep_declared === 'yes' && (
            <>
              {/* 职务类型 */}
              <div className="kyc-form-group">
                <label className="kyc-form-label">{t('职务类型')}</label>
                <button
                  type="button"
                  className={`kyc-form-input picker-trigger ${errors.pep_position_type ? 'error' : ''}`}
                  onClick={() => setPicker('pepPosition')}
                >
                  <span
                    className="picker-trigger-value"
                    style={formData.pep_position_type ? undefined : { color: 'var(--text-muted)' }}
                  >
                    {formData.pep_position_type
                      ? (PEP_POSITION_OPTIONS.find(o => o.value === formData.pep_position_type) || {}).label
                      : t('请选择职务类型')}
                  </span>
                  <ChevronDown size={18} className="picker-caret" />
                </button>
                {errors.pep_position_type && <span className="kyc-form-error">{errors.pep_position_type}</span>}
              </div>

              {/* 所在机构 */}
              <div className="kyc-form-group">
                <label className="kyc-form-label">{t('所在机构')}</label>
                <input
                  type="text"
                  className={`kyc-form-input ${errors.pep_organization ? 'error' : ''}`}
                  placeholder={t('例如：中华人民共和国国务院')}
                  value={formData.pep_organization}
                  onChange={e => update('pep_organization', e.target.value)}
                />
                {errors.pep_organization && <span className="kyc-form-error">{errors.pep_organization}</span>}
              </div>

              {/* 任职时间 */}
              <div className="kyc-form-group">
                <label className="kyc-form-label">{t('任职时间')}</label>
                <input
                  type="text"
                  className={`kyc-form-input ${errors.pep_tenure ? 'error' : ''}`}
                  placeholder={t('例如：2020-至今')}
                  value={formData.pep_tenure}
                  onChange={e => update('pep_tenure', e.target.value)}
                />
                {errors.pep_tenure && <span className="kyc-form-error">{errors.pep_tenure}</span>}
              </div>

              {/* 提示信息 */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('政治敏感人物需接受增强尽调（EDD），包括资金来源证明、职务核实、高级管理层审批等。')}
                </span>
              </div>
            </>
          )}
        </div>


      </div>

      <div className="kyc-actions">
        <button className="kyc-btn kyc-btn-primary" onClick={handleSubmit}>
          {t('下一步：上传证件')}
        </button>
      </div>

      {/* 出生日期选择 sheet（iOS HIG wheel picker 紧凑模式） */}
      {showDateSheet && (
        <div className="sheet-mask" onClick={() => setShowDateSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <span className="sheet-title">{t('选择出生日期')}</span>
              <button className="btn-icon" onClick={() => setShowDateSheet(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="sheet-sub">{t('演示模式：日期预设为 mock 数据')}</div>
            <div className="sheet-body">
              <DateWheelPicker
                value={formData.birth_date}
                onChange={v => update('birth_date', v)}
                t={t}
                lang={lang}
                minYear={1900}
                maxYear={2026}
                initialYear={1980}
              />
            </div>
            <div className="sheet-footer">
              <button className="kyc-btn kyc-btn-primary" onClick={() => setShowDateSheet(false)}>
                {t('完成')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 选择类字段底部弹层（2026-11-05：替代原生 select） */}
      <BottomPicker
        open={picker === 'nationality'}
        title={t('国籍')}
        options={NATIONALITY_OPTIONS}
        value={formData.nationality}
        onSelect={v => update('nationality', v)}
        onClose={() => setPicker(null)}
      />
      <BottomPicker
        open={picker === 'pepPosition'}
        title={t('职务类型')}
        options={PEP_POSITION_OPTIONS}
        value={formData.pep_position_type}
        onSelect={v => update('pep_position_type', v)}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
