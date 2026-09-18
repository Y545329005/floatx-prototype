import { useState, useRef } from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { useLang } from '../i18n';
import {
  subscriptions, spvs, getProjectById,
  signSpvInApp, buildSpvAgreementSections, E_SIGNATURE_NOTICE_TEXT, formatCurrency,
} from '../mock/data';
import SignatureCanvas from '../components/SignatureCanvas';
import AgreeCheckbox from '../components/AgreeCheckbox';

// SPV 协议 APP 内签署页（2026-09-15 · 用户裁决：推翻方案 B 第三方签署平台，与公司实践案例一致——
// 用户在 APP 内阅读协议全文 + Canvas 电子签名完成签署，签名图/协议版本/哈希签署时固化存档）
// 路由：#spv-sign/:subId（allocated 状态的申购单）
export default function SpvSign({ id, navigate, goBack }) {
  const { t, lang } = useLang();
  const pick = (dict) => dict[lang] || dict['zh-CN'];

  const sub = subscriptions.find(s => s.id === id);
  const spv = sub ? spvs.find(s => s.projectId === sub.projectId) : null;

  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signRef = useRef(null);

  // 校验失败兜底（正常入口均为 allocated 的「立即签署」CTA）
  if (!sub || sub.status !== 'allocated' || !spv) {
    return (
      <div className="page spv-sign-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#subscriptions')}><ArrowLeft size={20} /></button>
            <h1>{t('签署 SPV 协议')}</h1>
          </div>
        </div>
        <div className="empty-state">{t('当前申购不可签署（仅已获配额的意向可签署）')}</div>
      </div>
    );
  }

  const project = getProjectById(sub.projectId);
  const sections = buildSpvAgreementSections(spv, sub, lang);
  const canSubmit = agreed && hasSignature && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const signatureImage = signRef.current?.getDataUrl();
    if (!signatureImage) {
      setError(t('请先在签名区完成签名'));
      return;
    }
    setSubmitting(true);
    const res = signSpvInApp({ subId: sub.id, signatureImage });
    setSubmitting(false);
    if (res.ok) {
      navigate(`#my-subscription/${sub.id}`);
    } else {
      setError(res.error || t('签署失败，请稍后重试'));
    }
  };

  return (
    <div className="page spv-sign-page">
      <div className="subpage-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack(`#my-subscription/${sub.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('签署 SPV 协议')}</h1>
        </div>
      </div>

      {/* 签署对象卡 */}
      <div className="card spv-sign-info-card">
        <div className="card-title">{t('签署对象')}</div>
        <div className="subscription-info-row"><span>{t('SPV 名称')}</span><strong>{spv.spvName}</strong></div>
        <div className="subscription-info-row"><span>{t('项目')}</span><strong>{sub.projectName}</strong></div>
        <div className="subscription-info-row"><span>{t('认缴金额')}</span><strong className="date-iso">HK$ {formatCurrency(sub.frozenAmount || sub.amount || 0)}</strong></div>
        <div className="subscription-info-row"><span>{t('协议版本')}</span><strong className="date-iso">{spv.agreementVersion || 'v1.0'}</strong></div>
        {spv.agreementHash && (
          <div className="subscription-info-row">
            <span>{t('文档哈希')}</span>
            <strong className="date-iso spv-sign-hash" title={spv.agreementHash}>{spv.agreementHash.slice(0, 28)}…</strong>
          </div>
        )}
        <p className="spv-sign-hint">{t('签署时协议版本与哈希将被固化存档，作为签署内容不可篡改的依据')}</p>
      </div>

      {/* 协议全文（APP 内阅读） */}
      <div className="card card-secondary spv-sign-agreement-card">
        <div className="card-title"><FileText size={14} className="inline-icon" /> {t('协议全文')}</div>
        {sections.map((s, i) => (
          <div key={i} className="agreement-section">
            <h4>{s.h}</h4>
            <p>{s.p}</p>
          </div>
        ))}
        {project && (
          <p className="text-muted text-sm spv-sign-proj-note">
            {t('标的项目')}：{project.title} · {t(project.stage)}
          </p>
        )}
      </div>

      {/* 签署声明 + 电子签名 */}
      <div className="card card-secondary spv-sign-sign-card">
        <div className="card-title">{t('电子签名法律效力')}</div>
        <div className="agreement-section">
          <p>{pick(E_SIGNATURE_NOTICE_TEXT)}</p>
        </div>

        <AgreeCheckbox
          checked={agreed}
          onToggle={() => { setAgreed(!agreed); setError(''); }}
          className="form-checkbox-group spv-sign-agree"
          style={{ cursor: 'pointer' }}
          label={t('本人已阅读并同意本协议全部条款，确认以认缴金额完成出资')}
        >
          <span>{t('本人已阅读并同意本协议全部条款，确认以认缴金额完成出资')}</span>
        </AgreeCheckbox>

        <div className="kyc-form-group" style={{ marginTop: 'var(--space-3)' }}>
          <label className="kyc-form-label">
            <ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('本人电子签名')}
          </label>
          <div className="kyc-form-hint">{t('点击签名区进入全屏书写，确认后回填')}</div>
          <SignatureCanvas ref={signRef} onChange={setHasSignature} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary btn-full spv-sign-submit"
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.45, marginTop: 'var(--space-3)' }}
          onClick={handleSubmit}
        >
          {submitting ? t('签署中...') : t('确认签署并出资')}
        </button>
        <p className="text-muted text-sm spv-sign-note">
          {t('点击确认后将从冻结金额完成扣款并生成持仓份额，签署不可撤销')}
        </p>
      </div>
    </div>
  );
}
