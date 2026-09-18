import { useState } from "react";
import { ArrowLeft, ShieldCheck, User, Calendar, Globe, ChevronDown, X, ChevronUp, AlertCircle } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, updateKycProfile } from "../mock/data";

// 英文月份全名（iOS date picker 默认格式）
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 根据年月计算该月天数
function daysInMonth( year, month ) {
  // month 1-12；0 月表示下一年 12 月
  const m = month === 0 ? 12 : month > 12 ? 1 : month;
  const y = month === 0 ? year - 1 : month > 12 ? year + 1 : year;
  return new Date(y, m, 0).getDate();
}

// iOS HIG 紧凑模式 wheel picker（三个并列 column）
function DateWheelPicker({ value, onChange, t, lang }) {
  // 解析当前值 YYYY-MM-DD
  const parts = (value || '').split('-');
  const curYear = parseInt(parts[0]) || 1980;
  const curMonth = parseInt(parts[1]) || 5;
  const curDay = parseInt(parts[2]) || 15;

  // 年份范围：1900~今年
  const years = Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 1900 + i);
  // 月份 1~12
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  // 日按当前年月动态计算
  const days = Array.from({ length: daysInMonth(curYear, curMonth) }, (_, i) => i + 1);

  const setDate = (y, m, d) => {
    const yy = String(y).padStart(4, '0');
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${yy}-${mm}-${dd}`);
  };

  // 增减 helper（按钮 ▲▼ 用）
  const adjust = (field, delta) => {
    if (field === 'year') {
      const newY = Math.max(1900, Math.min(2026, curYear + delta));
      setDate(newY, curMonth, curDay);
    } else if (field === 'month') {
      const newM = curMonth === 12 && delta > 0 ? 1 : curMonth === 1 && delta < 0 ? 12 : curMonth + delta;
      setDate(curYear, newM, curDay);
    } else {
      // 日在月份范围内循环
      const maxDay = daysInMonth(curYear, curMonth);
      let newD = curDay + delta;
      if (newD > maxDay) newD = 1;
      else if (newD < 1) newD = maxDay;
      setDate(curYear, curMonth, newD);
    }
  };

  // 显示值：英文月份用全名，其他直接显示数字
  const formatDisplay = {
    year: y => `${y}${lang === 'zh-CN' || lang === 'zh-HK' ? t('年') : ''}`,
    month: m => lang === 'en' ? t(MONTH_NAMES_EN[m - 1]) : `${m}${t('月')}`,
    day: d => `${d}${lang === 'zh-CN' || lang === 'zh-HK' ? t('日') : ''}`,
  };

  // 简化的 wheel column：▲ + value-wrap(select透明覆盖中间) + ▼
  const Column = ({ field, options, current }) => (
    <div className="kyc-date-wheel-col">
      <button
        type="button"
        className="kyc-date-wheel-arrow"
        onClick={() => adjust(field, -1)}
        aria-label="Decrease"
      >
        <ChevronUp size={18} />
      </button>
      <div className="kyc-date-wheel-value-wrap">
        <div className="kyc-date-wheel-value">{formatDisplay[field](current)}</div>
        <select
          className="kyc-date-wheel-select"
          value={current}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (field === 'year') setDate(v, curMonth, curDay);
            else if (field === 'month') setDate(curYear, v, curDay);
            else setDate(curYear, curMonth, v);
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{formatDisplay[field](opt)}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="kyc-date-wheel-arrow"
        onClick={() => adjust(field, 1)}
        aria-label="Increase"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );

  return (
    <div className="kyc-date-wheels">
      <Column field="year" options={years} current={curYear} />
      <Column field="month" options={months} current={curMonth} />
      <Column field="day" options={days} current={curDay} />
    </div>
  );
}

export default function KYCStart({ navigate, goBack, setIsLoggedIn }) {
  const { t, lang } = useLang();
  const profile = currentUser.kyc_profile || {};
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name_en: profile.name_en || "",
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
    if (!formData.name_en) newErrors.name_en = t("请输入英文姓名");
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
    updateKycProfile({
      name_en: formData.name_en,
      name_cn: formData.name_cn,
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
          <span className="kyc-header-title">{t('专业投资者认证')}</span>
          <button className="kyc-exit-btn" onClick={() => setShowExitConfirm(true)}>
            <span>{t('退出登录')}</span>
          </button>
        </div>
      </div>

      {/* 退出登录确认弹窗 */}
      {showExitConfirm && (
        <div className="sheet-mask" onClick={() => setShowExitConfirm(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ padding: 'var(--space-6)', maxWidth: 320, margin: '0 auto' }}>
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

      {/* 进度条（2026-09-15 收敛为 3 步：基本信息 → 身份证件 → 地址证明；KYC 内签署模块已移除） */}
      <div className="kyc-progress">
        <div className="kyc-progress-bar">
          <div className="kyc-progress-fill" style={{ width: '33.3%' }} />
          <span className="kyc-progress-dot active" style={{ left: '16.5%' }} />
          <span className="kyc-progress-dot" style={{ left: '50%' }} />
          <span className="kyc-progress-dot" style={{ left: '83.5%' }} />
        </div>
        <div className="kyc-progress-steps">
          <span className="kyc-progress-step active">1. {t('基本信息')}</span>
          <span className="kyc-progress-step">2. {t('身份证件')}</span>
          <span className="kyc-progress-step">3. {t('地址证明')}</span>
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

          {/* 英文姓名 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">
              <User size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('英文姓名（与证件一致）')}
            </label>
            <input
              type="text"
              className={`kyc-form-input ${errors.name_en ? 'error' : ''}`}
              placeholder={t('例如：CHAN Tai Man')}
              value={formData.name_en}
              onChange={e => update('name_en', e.target.value)}
            />
            {errors.name_en && <span className="kyc-form-error">{errors.name_en}</span>}
          </div>

          {/* 中文姓名 */}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('中文姓名')}</label>
            <input
              type="text"
              className="kyc-form-input"
              placeholder={t('可选')}
              value={formData.name_cn}
              onChange={e => update('name_cn', e.target.value)}
            />
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
            <select
              className={`kyc-form-input ${errors.nationality ? 'error' : ''}`}
              value={formData.nationality}
              onChange={e => update('nationality', e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">{t('请选择国籍')}</option>
              <option value="HK">{t('中国香港')}</option>
              <option value="CN">{t('中国大陆')}</option>
              <option value="MO">{t('中国澳门')}</option>
              <option value="TW">{t('中国台湾')}</option>
              <option value="GB">{t('英国')}</option>
              <option value="US">{t('美国')}</option>
              <option value="SG">{t('新加坡')}</option>
              <option value="OTHER">{t('其他')}</option>
            </select>
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
                <select
                  className={`kyc-form-input ${errors.pep_position_type ? 'error' : ''}`}
                  value={formData.pep_position_type}
                  onChange={e => update('pep_position_type', e.target.value)}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">{t('请选择职务类型')}</option>
                  <option value="political">{t('政治人物')}</option>
                  <option value="government">{t('政府官员')}</option>
                  <option value="soe_executive">{t('国有企业高管')}</option>
                  <option value="intl_org">{t('国际组织负责人')}</option>
                  <option value="other">{t('其他')}</option>
                </select>
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
    </div>
  );
}
