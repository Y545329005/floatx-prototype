import { ArrowLeft, Shield, Smartphone, Lock, BadgeCheck, ChevronRight, Languages, Mail } from 'lucide-react';
import { currentUser } from '../mock/data';
import { useLang, LANGUAGES } from '../i18n';

export default function Settings({ navigate, goBack }) {
  const pi = currentUser.pi;
  const sec = currentUser.security;
  const { lang, setLang, t } = useLang();

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
          <div className="detail-stat">
            <span className="detail-stat-label">{t('手机')}</span>
            <span className="detail-stat-value">{currentUser.phone}</span>
          </div>
        </div>
        <div className="detail-stat-row">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('邮箱')}</span>
            <span className="detail-stat-value">{currentUser.email}</span>
          </div>
        </div>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('PI 认证')}</h3>
        <div className="settings-status-row">
          <div className="settings-status-icon verified">
            <BadgeCheck size={18} />
          </div>
          <div className="settings-status-body">
            <strong>{t('已认证')} · {pi ? pi.category : t('专业投资者')}</strong>
            <span className="text-muted text-sm">{pi ? pi.basis : ''}</span>
          </div>
          <span className="tag tag-success">{t('有效')}</span>
        </div>
        <div className="detail-stat-row mt-14">
          <div className="detail-stat">
            <span className="detail-stat-label">{t('认证编号')}</span>
            <span className="detail-stat-value">{pi ? pi.investorNo : '—'}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">{t('有效期至')}</span>
            <span className="detail-stat-value">{pi ? pi.expiresAt : '—'}</span>
          </div>
        </div>
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('登录安全')}</h3>
        <div className="menu-list settings-security">
          <div className="menu-item" onClick={() => navigate('bind-phone')}>
            <Smartphone size={18} />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('绑定手机')}</span>
              <span className="menu-item-sub">{currentUser.kyc_profile && currentUser.kyc_profile.phoneVerified ? t('已验证') : t('未验证')}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </div>
          <div className="menu-item" onClick={() => navigate('change-email')}>
            <Mail size={18} />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('更换邮箱')}</span>
              <span className="menu-item-sub">{currentUser.email}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </div>
          <div className="menu-item">
            <Shield size={18} />
            <span className="menu-item-label">
              <span className="menu-item-title">{t('双重验证 (2FA)')}</span>
              <span className="menu-item-sub">{sec && sec.twoFactorEnabled ? t('已开启') : t('未开启')}</span>
            </span>
            <span className="settings-value">{sec && sec.twoFactorEnabled ? t('已开启') : ''}</span>
          </div>
          <div className="menu-item">
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
            <div key={l.code} className={`menu-item ${lang === l.code ? 'lang-active' : ''}`} onClick={() => setLang(l.code)}>
              <Languages size={18} />
              <span className="menu-item-label">
                <span className="menu-item-title">{l.label}</span>
              </span>
              {lang === l.code && <span className="lang-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
