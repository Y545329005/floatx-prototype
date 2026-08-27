import { useState } from "react";
import { ArrowLeft, Upload, Check, AlertCircle, ShieldCheck, RotateCcw } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, updateKycProfile } from "../mock/data";

// eKYC 核验流程状态（T3 · PRD §3.10 技术证据层）
// 轻量 mock：上传证件后触发"人脸比对 + 活体检测 + 证件 OCR"模拟核验，结果落档供后台决策
const EKYC_STATE = {
  IDLE: 'idle',            // 未核验
  VERIFYING: 'verifying',  // 核验中（模拟加载）
  PASSED: 'passed',        // 核验通过
  FAILED: 'failed',        // 核验失败（可重试）
};
const EKYC_MAX_ATTEMPTS = 3; // 重试次数限制（24h 内，mock 会话级）

export default function KYCIdUpload({ navigate, goBack }) {
 const { t } = useLang();
 const profile = currentUser.kyc_profile || {};

const [idType, setIdType] = useState(profile.idDocType || "HK_ID");
const [frontFile, setFrontFile] = useState(null);
const [backFile, setBackFile] = useState(null);
 const [errors, setErrors] = useState({});
 // eKYC 核验状态（T3）
 const [ekycState, setEkycState] = useState(EKYC_STATE.IDLE);
 const [attempts, setAttempts] = useState(0);
 const [ekycResult, setEkycResult] = useState(null);

 const handleFrontUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  // FileReader 转 base64 存 profile，后台审核可真实预览证件原件（mock 阶段替代真实上传）
  const reader = new FileReader();
  reader.onload = () => {
  setFrontFile({ name: file.name, size: file.size, dataUrl: reader.result });
  if (errors.front) setErrors(prev => ({ ...prev, front: null }));
  };
  reader.readAsDataURL(file);
  };

 const handleBackUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
  setBackFile({ name: file.name, size: file.size, dataUrl: reader.result });
  if (errors.back) setErrors(prev => ({ ...prev, back: null }));
  };
  reader.readAsDataURL(file);
  };

 const validateForm = () => {
 const newErrors = {};
 if (!frontFile) newErrors.front = t("请上传证件正面");
 if (idType !== 'PASSPORT' && !backFile) newErrors.back = t("请上传证件背面");
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 };

 // 触发 eKYC 核验（mock：模拟人脸比对+活体检测+OCR 的 2.5s 处理）
 const runEkyc = () => {
   if (attempts >= EKYC_MAX_ATTEMPTS) {
     setEkycResult({ status: 'failed', failReason: `核验重试次数已达上限（${EKYC_MAX_ATTEMPTS} 次/24h），已转入人工审核队列` });
     setEkycState(EKYC_STATE.FAILED);
     return;
   }
   setEkycState(EKYC_STATE.VERIFYING);
   setEkycResult(null);
   // 模拟第三方服务商异步返回（~2.5s）
   setTimeout(() => {
     // mock 结果：约 90% 通过；其余失败可重试
     const passed = Math.random() > 0.1;
     const nextAttempts = attempts + 1;
     setAttempts(nextAttempts);
     if (passed) {
       const result = {
         status: 'passed',
         score: Math.round((0.88 + Math.random() * 0.11) * 100) / 100,
         vendorRef: `EKYC${Date.now()}`,
         livenessPass: true,
         ocrPass: true,
         verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
         failReason: null,
       };
       setEkycResult(result);
       setEkycState(EKYC_STATE.PASSED);
       // 落档：eKYC 结果随申请入队（后台抽屉「eKYC 结果」卡读取）
       updateKycProfile({ ekycResult: result });
     } else {
       const failReasons = ['证件 OCR 信息与填写内容不一致', '活体检测未通过（疑似照片/视频翻拍）', '人脸比对相似度低于阈值'];
       const result = {
         status: 'failed',
         score: Math.round((0.5 + Math.random() * 0.3) * 100) / 100,
         vendorRef: `EKYC${Date.now()}`,
         livenessPass: Math.random() > 0.5,
         ocrPass: Math.random() > 0.5,
         verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
         failReason: failReasons[Math.floor(Math.random() * failReasons.length)],
       };
       setEkycResult(result);
       setEkycState(EKYC_STATE.FAILED);
     }
   }, 2500);
 };

 const handleSubmit = () => {
 if (!validateForm()) return;
 // 已通过核验 → 落档证件信息并跳转步骤③
 updateKycProfile({
 idDocType: idType,
 idDocFront: frontFile,
 idDocBack: backFile,
 });
 navigate("kyc-address-proof");
 };

 return (
 <div className="kyc-page">
 <div className="kyc-header">
 <div className="kyc-header-inner">
 <button className="kyc-back-btn" onClick={goBack}>
 <ArrowLeft size={20} />
 <span>{t('返回')}</span>
 </button>
 <span className="kyc-header-title">{t('身份证件')}</span>
 <div style={{ width: 60 }} />
 </div>
 </div>

<div className="kyc-progress">
    <div className="kyc-progress-bar">
      <div className="kyc-progress-fill" style={{ width: '66.67%' }} />
      <span className="kyc-progress-dot done" style={{ left: '16.67%' }} />
      <span className="kyc-progress-dot active" style={{ left: '50%' }} />
      <span className="kyc-progress-dot" style={{ left: '83.33%' }} />
    </div>
    <div className="kyc-progress-steps">
      <span className="kyc-progress-step done">1. {t('基本信息')}</span>
      <span className="kyc-progress-step active">2. {t('身份证件')}</span>
      <span className="kyc-progress-step">3. {t('地址证明')}</span>
    </div>
 </div>

 <div className="kyc-content">
 <div className="kyc-card">
 <div className="kyc-card-title">{t('身份证件')}</div>

 {/* 证件类型选择 */}
 <div className="kyc-form-group">
 <label className="kyc-form-label">{t('证件类型')}</label>
<select
              className="kyc-form-input"
              value={idType}
              onChange={e => {
                setIdType(e.target.value);
                // 切换证件类型时清空已上传图片（HK ID 的图片不能证明 Passport）
                setFrontFile(null);
                setBackFile(null);
                setEkycState(EKYC_STATE.IDLE);
                setEkycResult(null);
                if (errors.front) setErrors(prev => ({ ...prev, front: null }));
                if (errors.back) setErrors(prev => ({ ...prev, back: null }));
              }}
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
 <option value="HK_ID">{t('香港身份证')}</option>
 <option value="PASSPORT">{t('护照')}</option>
 <option value="CMNH">{t('内地通行证')}</option>
 </select>
 <div className="kyc-form-hint">
 {idType === 'PASSPORT' ? t('请上传 1 张') : t('请上传 2 张（正面 + 背面）')}
 </div>
 </div>

 {/* 证件正面 */}
 <div className="kyc-form-group">
 <label className="kyc-form-label">
 {idType === 'HK_ID' ? t('香港身份证正面') : idType === 'PASSPORT' ? t('护照封面') : t('通行证正面')}
 </label>
 <label className={`kyc-upload-zone ${frontFile ? 'has-file' : ''} ${errors.front ? 'error' : ''}`}>
 <input
 type="file"
 accept="image/*"
 style={{ display: 'none' }}
 onChange={handleFrontUpload}
 />
 {frontFile ? (
 <>
 <Check size={24} style={{ color: 'var(--success)' }} />
 <div className="kyc-upload-file-name">{frontFile.name}</div>
 </>
 ) : (
 <>
 <div className="kyc-upload-icon">
 <Upload size={24} />
 </div>
 <div className="kyc-upload-text">{t('点击上传证件正面')}</div>
 <div className="kyc-upload-hint">{t('支持 JPG、PNG，不超过 10MB')}</div>
 </>
 )}
 </label>
 {errors.front && <span className="kyc-form-error">{errors.front}</span>}
 </div>

 {/* 证件背面（香港身份证/通行证） */}
 {idType !== 'PASSPORT' && (
 <div className="kyc-form-group">
 <label className="kyc-form-label">
 {idType === 'HK_ID' ? t('香港身份证背面') : t('通行证背面')}
 </label>
 <label className={`kyc-upload-zone ${backFile ? 'has-file' : ''} ${errors.back ? 'error' : ''}`}>
 <input
 type="file"
 accept="image/*"
 style={{ display: 'none' }}
 onChange={handleBackUpload}
 />
 {backFile ? (
 <>
 <Check size={24} style={{ color: 'var(--success)' }} />
 <div className="kyc-upload-file-name">{backFile.name}</div>
 </>
 ) : (
 <>
 <div className="kyc-upload-icon">
 <Upload size={24} />
 </div>
 <div className="kyc-upload-text">{t('点击上传证件背面')}</div>
 <div className="kyc-upload-hint">{t('支持 JPG、PNG，不超过 10MB')}</div>
 </>
 )}
 </label>
 {errors.back && <span className="kyc-form-error">{errors.back}</span>}
 </div>
 )}

 {/* eKYC 身份核验（T3 · PRD §3.10）：上传后触发技术核验层 */}
 <div className="kyc-ekyc-section">
   <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
     <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
     <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>eKYC 身份核验</span>
   </div>

   {ekycState === EKYC_STATE.IDLE && (
     <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
       <AlertCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
       <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
         {t('系统将对您进行实时身份核验（人脸比对 + 活体检测 + 证件识别），核验结果将作为审核的技术依据')}
       </div>
     </div>
   )}

   {ekycState === EKYC_STATE.VERIFYING && (
     <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
       <span className="kyc-ekyc-spinner" aria-hidden="true" />
       <div>
         <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 2 }}>eKYC 核验中...</div>
         <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>正在比对证件信息与人脸特征，请保持正对屏幕</div>
       </div>
     </div>
   )}

   {ekycState === EKYC_STATE.PASSED && ekycResult && (
     <div style={{ padding: 'var(--space-3)', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
         <Check size={16} style={{ color: 'var(--success)' }} />
         <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--success)' }}>核验通过</span>
       </div>
       <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
         <div>人脸比对相似度：<strong>{Math.round(ekycResult.score * 100)}%</strong> · 活体检测：通过 · 证件识别：通过</div>
         <div style={{ color: 'var(--text-muted)' }}>核验参考号：{ekycResult.vendorRef}</div>
       </div>
     </div>
   )}

   {ekycState === EKYC_STATE.FAILED && ekycResult && (
     <div style={{ padding: 'var(--space-3)', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
         <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
         <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>核验未通过</span>
       </div>
       <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
         <div>原因：{ekycResult.failReason}</div>
         {attempts >= EKYC_MAX_ATTEMPTS ? (
           <div style={{ color: 'var(--danger)', marginTop: 4 }}>重试次数已达上限，将转入人工审核队列，请耐心等待</div>
         ) : (
           <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>您还可以重试 {EKYC_MAX_ATTEMPTS - attempts} 次（24 小时内）</div>
         )}
       </div>
       {attempts < EKYC_MAX_ATTEMPTS && (
         <button
           className="kyc-btn kyc-btn-secondary"
           style={{ marginTop: 'var(--space-2)', padding: '6px 14px', fontSize: 'var(--text-xs)' }}
           onClick={runEkyc}
         >
           <RotateCcw size={14} style={{ marginRight: 4 }} />
           重新核验
         </button>
       )}
     </div>
   )}
 </div>

 <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
 <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
 <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
 {t('请确保证件照片清晰可辨，边角完整无遮挡')}
 </div>
 </div>
 </div>
 </div>

 <div className="kyc-actions">
 {ekycState === EKYC_STATE.PASSED ? (
   <button className="kyc-btn kyc-btn-primary" onClick={handleSubmit}>
     {t('下一步：地址证明')}
   </button>
 ) : ekycState === EKYC_STATE.VERIFYING ? (
   <button className="kyc-btn kyc-btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
     {t('正在核验身份...')}
   </button>
 ) : (
   <button className="kyc-btn kyc-btn-primary" onClick={runEkyc} disabled={!frontFile || (idType !== 'PASSPORT' && !backFile)}>
     <ShieldCheck size={16} style={{ marginRight: 6 }} />
     {t('开始 eKYC 核验')}
   </button>
 )}
 </div>
 </div>
 );
}
