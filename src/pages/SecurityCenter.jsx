import { useState } from 'react';
import { ArrowLeft, Shield, KeyRound, Fingerprint, Smartphone, Trash2, Plus, AlertTriangle, History, Lock, Mail } from 'lucide-react';
import { useLang } from '../i18n';
import SecurityVerifySheet from '../components/SecurityVerifySheet';
import GaSetupFlow from '../components/GaSetupFlow';
import {
  currentUser, getUserSecurity, listPasskeys, addPasskey, removePasskey,
  resolveSensitiveFactors, consumeAuthToken, isKyc1, getFreezeState,
  requestGaReset, changeUserPassword,
} from '../mock/data';

// 安全中心（2026-09-22 · 复刻规格 5.2/5.3：安全项生命周期管理）
// 敏感操作前置验证（INV-4）：点操作入口立即弹安全验证，验证通过前操作内容不可见。
// 验证矩阵（规格 5.2）：有 Passkey 单验 / GA+SMS 双验 / 仅 SMS（KYC1 叠加人脸）；无因子 → 阻断引导绑手机。
const maskPhone = (p) => {
  if (!p) return '';
  const digits = p.replace(/\s/g, '');
  return digits.length > 5 ? `${digits.slice(0, 3)}****${digits.slice(-4)}` : digits;
};

export default function SecurityCenter({ navigate, goBack, setToast, setIsLoggedIn }) {
  const { t } = useLang();
  const sec = getUserSecurity();
  const freeze = getFreezeState();
  const kyc1 = isKyc1();

  // 弹窗状态机：null | { kind: 'verify'|'ga-bind'|'ga-reset'|'pk-add'|'pk-remove'|'pwd'|'relogin', passkey?, token?, message? }
  const [flow, setFlow] = useState(null);
  const [pwdForm, setPwdForm] = useState({ p1: '', p2: '' });
  const [gaResetRisk, setGaResetRisk] = useState(false);
  const [pkRemoveRisk, setPkRemoveRisk] = useState(null);
  // （2026-10-15）tick/refresh 已随「操作后 toast 留原页」模式一并移除：
  // 改密/MFA 变更现全部改道强制重登页（UC 事件④⑤），无「留原页读新状态」场景

  const gaBound = sec.ga.bound;
  const passkeys = listPasskeys();

  // UC 事件④⑤（§9.8）：改密/MFA 变更全端失效（含本端）——固定文案页强制重新登录
  // 2026-10-15 对齐：原「toast 后留在原页」为 mock 简化，与 UC 全端失效口径冲突，已废除
  const forceRelogin = (message) => setFlow({ kind: 'relogin', message });

  // 敏感操作统一入口：先前置验证（空因子 → 阻断引导绑手机，对应「未绑 GA 阻断提币」同构逻辑）
  const startSensitive = (kind) => {
    // Passkey 绑定前置 KYC（UC §4.4 V1.2 定稿）——入口 UI gate（数据层 addPasskey 另有兜底）
    if (kind === 'pk-add' && !kyc1) {
      setToast(t('完成身份认证后可绑定通行密钥'));
      navigate('kyc-start');
      return;
    }
    const factors = resolveSensitiveFactors();
    if (factors.length === 0) {
      setToast(t('为保护账户安全，请先绑定手机号后再进行安全项变更'));
      navigate('bind-phone');
      return;
    }
    setFlow({ kind, factors });
  };

  const onVerified = (token) => {
    const consumed = consumeAuthToken(token);
    if (!consumed.ok) { setToast(t('验证凭证已失效，请重新验证')); setFlow(null); return; }
    const kind = flow?.kind;
    if (kind === 'ga-bind') setFlow({ kind: 'ga-bind-flow' });      // 验证通过后才展示密钥（INV-4）
    else if (kind === 'ga-reset') { setFlow(null); setGaResetRisk(true); }
    else if (kind === 'pk-add') { doAddPasskey(); }
    else if (kind === 'pk-remove') { doRemovePasskey(flow.passkey); } // 风险确认后的身份验证放行
    else if (kind === 'pwd') setFlow({ kind: 'pwd-form' });
    else setFlow(null);
  };

  const doAddPasskey = () => {
    setFlow({ kind: 'pk-adding' });
    setTimeout(() => {
      const res = addPasskey(); // 内部已落安全历史 + 警报 + 冻结；KYC 兜底拒绝见 data.js
      setFlow(null);
      if (res.ok) {
        // UC 事件⑤：MFA 变更全端失效（含本端）→ 固定文案页强制重新登录
        forceRelogin(t('安全项已变更。为保障账户安全，所有设备已退出登录，请重新登录。'));
      } else {
        setToast(t(res.message));
      }
    }, 1600);
  };

  const doRemovePasskey = (pk) => {
    const res = removePasskey(pk ? pk.id : '');
    if (res.ok) {
      // UC 事件⑤：MFA 变更全端失效（含本端）→ 强制重新登录
      // （「最后一个安全项」提示已在删除风险确认层展示）
      forceRelogin(t('安全项已变更。为保障账户安全，所有设备已退出登录，请重新登录。'));
    } else {
      setToast(t(res.message));
    }
  };

  // 删除确认（规格 5.3.1 顺序：风险提示 → 身份验证 → 执行）
  const confirmRemovePasskey = () => {
    const pk = pkRemoveRisk;
    setPkRemoveRisk(null);
    const factors = resolveSensitiveFactors();
    if (factors.length === 0) {
      setToast(t('为保护账户安全，请先绑定手机号后再进行安全项变更'));
      navigate('bind-phone');
      return;
    }
    setFlow({ kind: 'pk-remove', factors, passkey: pk });
  };

  const doChangePassword = () => {
    // 密码策略（2026-10-15 与注册口径统一：至少8位，含字母和数字）
    if (pwdForm.p1.length < 8) { setToast(t('密码至少需要 8 个字符')); return; }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(pwdForm.p1)) { setToast(t('密码需同时包含字母和数字')); return; }
    if (pwdForm.p1 !== pwdForm.p2) { setToast(t('两次输入的密码不一致')); return; }
    const res = changeUserPassword(pwdForm.p1);
    setPwdForm({ p1: '', p2: '' });
    if (!res.ok) { setToast(t(res.message)); return; }
    // UC 事件④：改密全端失效（含本端）→ 固定文案页强制重新登录（流转7）
    forceRelogin(t('密码修改成功。为保障账户安全，所有设备已退出登录，请使用新密码重新登录。'));
  };

  const startGaReset = () => {
    const res = requestGaReset(); // 频控 24h ≤ 2 次（2026-09-23 修复：此前按钮未接此函数，频控失效）
    if (!res.ok) { setToast(t(res.message)); return false; }
    setGaResetRisk(false);
    setFlow({ kind: 'ga-reset-flow' });
    return true;
  };

  return (
    <div className="page security-center">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#settings')}><ArrowLeft size={20} /></button>
          <h1>{t('安全中心')}</h1>
        </div>
      </div>

      {freeze.frozen && (
        <div className="sc-freeze-banner">
          <AlertTriangle size={16} />
          <span>{t('安全冻结生效中：提现功能将暂停至 {time}（{reason}）').replace('{time}', String(freeze.until).replace('T', ' ').slice(0, 16)).replace('{reason}', freeze.reason || '')}</span>
        </div>
      )}

      {/* GA */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('谷歌验证器（GA）')}</h3>
        <div className="settings-status-row">
          <div className={`settings-status-icon ${gaBound ? 'verified' : ''}`}>
            <KeyRound size={18} />
          </div>
          <div className="settings-status-body">
            <strong>{gaBound ? t('已绑定') : t('未绑定')}</strong>
            <span className="text-muted text-sm">{gaBound ? `${t('绑定时间')} ${sec.ga.boundAt}` : t('绑定后作为高强度第二因子，防验证码转发与 SIM 劫持')}</span>
          </div>
        </div>
        <button className="btn btn-primary btn-sm settings-pi-action" onClick={() => startSensitive(gaBound ? 'ga-reset' : 'ga-bind')}>
          {gaBound ? t('重置 GA') : t('绑定 GA')}
        </button>
      </div>

      {/* 通行密钥 */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('通行密钥（Passkey）')} <span className="sc-count">{passkeys.length}/3</span></h3>
        {passkeys.map(pk => (
          <div key={pk.id} className="settings-status-row">
            <div className="settings-status-icon verified"><Fingerprint size={18} /></div>
            <div className="settings-status-body">
              <strong>{pk.name}</strong>
              <span className="text-muted text-sm">{`${t('添加于')} ${pk.createdAt}`}</span>
            </div>
            <button className="sc-remove-btn" aria-label={t('删除')} onClick={() => setPkRemoveRisk(pk)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button className="btn btn-primary btn-sm settings-pi-action" disabled={passkeys.length >= 3} onClick={() => startSensitive('pk-add')}>
          <Plus size={14} /> {t('添加通行密钥')}
        </button>
      </div>

      {/* 短信验证 */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('短信验证')}</h3>
        <div className="settings-status-row">
          <div className="settings-status-icon verified"><Smartphone size={18} /></div>
          <div className="settings-status-body">
            <strong>{maskPhone(currentUser.phone) || t('未绑定')}</strong>
            <span className="text-muted text-sm">{currentUser.phone ? t('用于登录兜底与安全项重置（KYC 用户叠加人脸）') : t('绑定手机号后启用')}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm settings-pi-action" onClick={() => navigate('bind-phone')}>
          {currentUser.phone ? t('更换手机号') : t('绑定手机号')}
        </button>
      </div>

      {/* 登录邮箱（INV-2：找回密码/安全通知主通道；换绑为敏感操作，收编自 Settings 2026-09-23） */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('登录邮箱')}</h3>
        <div className="settings-status-row">
          <div className="settings-status-icon verified"><Mail size={18} /></div>
          <div className="settings-status-body">
            <strong>{currentUser.email}</strong>
            <span className="text-muted text-sm">{t('用于登录、找回密码与安全警报通知')}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm settings-pi-action" onClick={() => navigate('change-email')}>
          {t('更换邮箱')}
        </button>
      </div>

      {/* 修改密码 */}
      <div className="card card-secondary">
        <h3 className="card-title">{t('登录密码')}</h3>
        <div className="settings-status-row">
          <div className="settings-status-icon verified"><Lock size={18} /></div>
          <div className="settings-status-body">
            <strong>{t('修改登录密码')}</strong>
            <span className="text-muted text-sm">{t('修改后所有设备将退出登录（含本设备），并冻结提现 24 小时')}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm settings-pi-action" onClick={() => startSensitive('pwd')}>
          {t('修改密码')}
        </button>
      </div>

      {/* 安全设置历史（X-4） */}
      <div className="card card-secondary">
        <h3 className="card-title"><History size={15} /> {t('安全设置历史')}</h3>
        {sec.history.length === 0
          ? <p className="text-muted text-sm">{t('暂无安全项变动记录')}</p>
          : sec.history.map((h, i) => (
            <div key={i} className="sc-history-row">
              <span className="sc-history-type">{t(h.type)}</span>
              <span className="text-muted text-sm">{h.time} · {h.device} · {t('验证')}: {h.method}</span>
            </div>
          ))}
      </div>

      <p className="sc-note text-muted text-sm">
        <Shield size={13} /> {t('双重验证不可关闭（合规要求），仅允许更改验证方式')}
      </p>

      {/* ===== 弹窗层 ===== */}

      {/* 通用前置安全验证（验证后阶段不重复显示 Sheet） */}
      {flow && !['ga-bind-flow', 'ga-reset-flow', 'pwd-form', 'pk-adding', 'relogin'].includes(flow.kind) && (
        <SecurityVerifySheet
          open
          factors={flow.factors}
          onVerified={onVerified}
          onClose={() => setFlow(null)}
          subtitle={t('验证通过后可进行安全项变更')}
        />
      )}

      {/* GA 首绑（验证通过后才展示密钥——INV-4） */}
      {flow?.kind === 'ga-bind-flow' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <h3>{t('绑定 GA')}</h3>
            <GaSetupFlow mode="bind" onDone={() => { setFlow(null); forceRelogin(t('安全项已变更。为保障账户安全，所有设备已退出登录，请重新登录。')); }} onCancel={() => setFlow(null)} />
          </div>
        </>
      )}

      {/* GA 重置风险确认（KYC1 文案含提现冻结） */}
      {gaResetRisk && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('重置 GA')}</h3>
            </div>
            <div className="emergency-risk">
              <AlertTriangle size={26} />
              <p>{kyc1
                ? t('为保护您的账户安全，重置 GA 后 24 小时内无法使用提现功能。旧验证器在新验证码验证通过前仍有效。')
                : t('重置 GA 后旧验证器将失效。新验证器在新验证码验证通过前仍有效。')}</p>
            </div>
            <div className="emergency-risk-actions">
              <button className="btn btn-secondary" onClick={() => setGaResetRisk(false)}>{t('取消')}</button>
              <button className="btn btn-danger" onClick={startGaReset}>{t('我已了解，继续')}</button>
            </div>
          </div>
        </>
      )}

      {/* GA 重置：GaSetupFlow（替换模式） */}
      {flow?.kind === 'ga-reset-flow' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <h3>{t('重置 GA')}</h3>
            <GaSetupFlow mode="reset" onDone={() => { setFlow(null); forceRelogin(t('安全项已变更。为保障账户安全，所有设备已退出登录，请重新登录。')); }} onCancel={() => setFlow(null)} />
          </div>
        </>
      )}

      {/* 添加通行密钥：模拟系统面板动画 */}
      {flow?.kind === 'pk-adding' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet svs-sheet">
            <div className="svs-sim">
              <div className="svs-sim-ring">
                <Fingerprint size={34} />
                <div className="svs-sim-scan" />
              </div>
              <p className="text-sm">{t('正在创建通行密钥…')}</p>
              <p className="text-muted text-sm">{t('演示模式：模拟系统生物识别面板')}</p>
            </div>
          </div>
        </>
      )}

      {/* 删除通行密钥风险确认（规格 5.3.1：KYC1 文案含冻结提示） */}
      {pkRemoveRisk && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('删除通行密钥')}</h3>
            </div>
            <div className="emergency-risk">
              <AlertTriangle size={26} />
              <p>{kyc1
                ? t('删除后不可恢复，您需要重新添加。为了保护您的账户安全，删除后 24 小时内无法使用提现功能。')
                : t('删除后不可恢复，您需要重新添加。')}</p>
              <p className="text-muted text-sm">{sec.passkeys.length === 1 && !gaBound ? t('这是您最后一个通行密钥，删除后将使用短信验证码登录') : ''}</p>
            </div>
            <div className="emergency-risk-actions">
              <button className="btn btn-secondary" onClick={() => setPkRemoveRisk(null)}>{t('取消')}</button>
              <button className="btn btn-danger" onClick={confirmRemovePasskey}>{t('确认删除')}</button>
            </div>
          </div>
        </>
      )}

      {/* 修改密码表单（验证通过后展示——INV-4） */}
      {flow?.kind === 'pwd-form' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('修改登录密码')}</h3>
            </div>
            <div className="form-group">
              <label className="form-label">{t('新密码')}</label>
              <input type="password" className="form-input" value={pwdForm.p1} onChange={e => setPwdForm(f => ({ ...f, p1: e.target.value }))} placeholder={t('至少 8 位，含字母和数字')} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('确认新密码')}</label>
              <input type="password" className="form-input" value={pwdForm.p2} onChange={e => setPwdForm(f => ({ ...f, p2: e.target.value }))} placeholder={t('再次输入新密码')} />
            </div>
            <div className="emergency-risk-actions">
              <button className="btn btn-secondary" onClick={() => setFlow(null)}>{t('取消')}</button>
              <button className="btn btn-primary" onClick={doChangePassword}>{t('确认修改')}</button>
            </div>
          </div>
        </>
      )}

      {/* 全端失效固定文案页（UC §9.8 事件④⑤ · 流转7）：改密/MFA 变更后强制重新登录 */}
      {flow?.kind === 'relogin' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('安全提示')}</h3>
            </div>
            <div className="emergency-risk">
              <Shield size={26} />
              <p>{flow.message}</p>
            </div>
            <div className="emergency-risk-actions">
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setFlow(null);
                  setIsLoggedIn(false);
                  navigate('login');
                }}
              >
                {t('重新登录')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
