import { useState } from 'react';
import { ArrowLeft, Shield, Lock, BadgeCheck, ChevronRight, Languages, Clock, XCircle, AlertCircle, Award, RotateCcw, AlertTriangle } from 'lucide-react';
import { clickable } from '../lib';
import { currentUser, KYC_STATUS, resetDemoData } from '../mock/data';
import { useLang, LANGUAGES } from '../i18n';

export default function Settings({ navigate, goBack }) {
  const pi = currentUser.pi;
  const sec = currentUser.security;
  const { lang, setLang, t } = useLang();
  // 演示重置二次确认（一键清空不可撤销，不允许单点触发）
  const [confirmReset, setConfirmReset] = useState(false);

  // 2026-09-18：PI 卡片分态渲染——此前无条件展示"已认证"，KYC 提交后即误导用户已获 PI 资格。
  // 仅 verified 且未过期展示认证详情；pending/rejected/expired 展示对应状态与操作；
  // none 仅在 KYC 已通过时展示"去认证"入口（KYC 未过不展示，避免超前引导）。
  const piStatus = pi?.status || 'none';
  const piExpiresAt = pi?.expiresAt;
  const piExpired = !!(piExpiresAt && new Date(piExpiresAt.replace(' ', 'T')).getTime() < Date.now());
  const kycApproved = currentUser.kyc_status === KYC_STATUS.APPROVED;

  const piCard = (() => {
    if (piStatus === 'verified' && !piExpired) {
      return {
        state: 'verified',
        icon: BadgeCheck,
        title: `${t('已认证')} · ${t(pi?.category || '专业投资者')}`,
        sub: pi?.basis ? t(pi.basis) : '',
        tag: t('有效'),
        tagCls: 'tag-success',
        target: null,
      };
    }
    if (piStatus === 'verified' && piExpired) {
      return {
        state: 'expired',
        icon: AlertCircle,
        title: t('PI 认证已过期'),
        sub: t('您的专业投资者资格已到期，需重新提交认证资料以恢复参与资格。'),
        tag: t('已过期'),
        tagCls: 'tag-warning',
        target: '#kyc-pi',
      };
    }
    if (piStatus === 'pending') {
      return {
        state: 'pending',
        icon: Clock,
        title: t('PI 认证审核中'),
        sub: t('您的专业投资者认证申请已成功提交，我们将在 1-3 个工作日内完成审核。'),
        tag: t('审核中'),
        tagCls: 'tag-warning',
        target: '#pi-submitted',
      };
    }
    if (piStatus === 'rejected') {
      return {
        state: 'rejected',
        icon: XCircle,
        title: t('PI 认证未通过'),
        sub: currentUser.kyc_profile?.rejectReason || t('资料不完整'),
        tag: t('未通过'),
        tagCls: 'tag-danger',
        target: '#kyc-pi',
      };
    }
    if (piStatus === 'none' && kycApproved) {
      return {
        state: 'none',
        icon: Award,
        title: t('未完成 PI 认证'),
        sub: t('完成专业投资者认证后可提交项目问卷'),
        tag: '',
        tagCls: '',
        target: '#kyc-pi',
      };
    }
    return null;
  })();
  const PiCardIcon = piCard?.icon;

  return (
    <div className="page settings-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('账户设置')}</h1>
        </div>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('个人信息')}</h3>
        <div className="detail-stat-row">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('姓名')}</span>
            <span className="detail-stat-value">{currentUser.name}</span>
          </div>
        </div>
        <div className="detail-stat-row">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('邮箱')}</span>
            <span className="detail-stat-value">{currentUser.email}</span>
          </div>
        </div>
      </div>

      {piCard && (
        <div className="card card-secondary">
          <h3 className="card-title">{t('PI 认证')}</h3>
          <div className={`settings-status-row ${piCard.state}`}>
            <div className={`settings-status-icon ${piCard.state}`}>
              <PiCardIcon size={18} />
            </div>
            <div className="settings-status-body">
              <strong>{piCard.title}</strong>
              <span className="text-muted text-sm">{piCard.sub}</span>
            </div>
            {piCard.tag && <span className={`tag ${piCard.tagCls}`}>{piCard.tag}</span>}
          </div>
          {piCard.state === 'verified' && (
            <div className="detail-stat-row mt-14">
              <div className="detail-stat">
                <span className="detail-stat-label">{t('认证编号')}</span>
                <span className="detail-stat-value">{pi?.investorNo || '—'}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">{t('有效期至')}</span>
                <span className="detail-stat-value">{pi?.expiresAt || '—'}</span>
              </div>
            </div>
          )}
          {piCard.target && (
            <button
              className="btn btn-primary btn-sm settings-pi-action"
              onClick={() => navigate(piCard.target)}
            >
              {piCard.state === 'pending' ? t('查看认证状态') : piCard.state === 'none' ? t('去认证') : t('重新认证')}
            </button>
          )}
        </div>
      )}

      <div className="card card-secondary">
        <h3 className="card-title">{t('登录安全')}</h3>
        <div className="menu-list settings-security">
          <div className="menu-item" {...clickable(() => navigate('security-center'))}>
            <Shield size={18} />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('双重验证 (2FA)')}</span>
              <span className="menu-item-sub">{t('管理 GA / 通行密钥 / 邮箱验证')}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </div>
          <div className="menu-item" {...clickable(() => navigate('security-center'))}>
            <Lock size={18} />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('修改登录密码')}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </div>
        </div>
        <div className="settings-login-note">
          <Shield size={15} />
          <span className="text-muted text-sm">{t('最近登录')} {sec ? sec.lastLogin : ''} · {sec ? sec.loginDevice : ''}</span>
        </div>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('语言设置')}</h3>
        <div className="menu-list settings-security">
          {LANGUAGES.map(l => (
            <div key={l.code} className={`menu-item ${lang === l.code ? 'lang-active' : ''}`} {...clickable(() => setLang(l.code))}>
              <Languages size={18} />
              <span className="menu-item-label">
                <span className="menu-item-title">{l.label}</span>
              </span>
              {lang === l.code && <span className="lang-check">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 演示维护（2026-10-28）：演示几次后余额/持仓/单据已经偏离初始态，
          没有入口就只能手动清缓存——非技术同事做不了。只清业务数据，保留语言与登录态。 */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('演示维护')}</h3>
        {!confirmReset && (
          <button className="list-item" onClick={() => setConfirmReset(true)}>
            <div className="list-item-icon"><RotateCcw size={18} /></div>
            <div className="list-item-content">
              <div className="list-item-title">{t('重置演示数据')}</div>
              <div className="list-item-subtitle">{t('恢复初始余额、持仓、单据与认证状态')}</div>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </button>
        )}
        {confirmReset && (
          <div className="settings-reset-confirm">
            <p className="text-sm">
              <AlertTriangle size={14} /> {t('将清空本机全部业务数据（余额、持仓、单据、认证、通知），回到初始种子状态。此操作不可撤销。')}
            </p>
            <div className="settings-reset-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmReset(false)}>{t('取消')}</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const res = resetDemoData();
                  if (res.ok) window.location.reload();
                }}
              >
                {t('确认重置')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
