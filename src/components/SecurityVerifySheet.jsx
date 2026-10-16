import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Smartphone, KeyRound, ScanFace, Fingerprint, ShieldCheck, AlertTriangle, Check, RefreshCw, LifeBuoy, Mail } from 'lucide-react';
import { useLang } from '../i18n';
import { GA_DEMO_MODE, createVerifySession, submitVerifyItem, completeVerifyItem, finalizeVerifySession } from '../mock/data';

// 安全验证弹窗（2026-09-22 · 复刻规格第 4 章：逐项验证 BottomSheet）
// - 逐项验证模式（规格 4.1，不可回退并行填写）：每项独立提交独立验证，进度 N/N
// - 协议三时机（规格 4.2）：打开建会话 / 每项完成即提交 / 全部完成 finalize 换授权 token
// - 因子：sms/email（mock 演示码 123456）/ ga（真 TOTP）/ passkey·face（模拟生物识别动画）
//   2026-10-15 UC 对齐：新增 email 因子（注册邮箱为强制通道，§9.4）；email 项屏蔽紧急登录入口，
//   无手机用户转客服引导（UC §10.5 人工核身兜底，一期不模拟人工流）
// - 会话 10 分钟（S-2），关闭弹窗即作废，下次重头开始
const FACTOR_META = {
  sms: { icon: Smartphone, title: '短信验证码', desc: '验证码将发送至您的手机' },
  email: { icon: Mail, title: '邮箱验证码', desc: '验证码将发送至您的注册邮箱' },
  ga: { icon: KeyRound, title: '谷歌验证器', desc: '输入 GA App 中的 6 位验证码' },
  passkey: { icon: Fingerprint, title: '通行密钥', desc: '使用本机生物识别验证' },
  face: { icon: ScanFace, title: '人脸识别', desc: '活体检测，确认本人操作' },
};

export default function SecurityVerifySheet({ open, factors, onVerified, onClose, onUnavailable, subtitle }) {
  const { t } = useLang();
  const [session, setSession] = useState(null); // { sessionId, items, expiresAt }
  const [activeItem, setActiveItem] = useState(null); // 当前展开的项
  const [code, setCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [gaErrors, setGaErrors] = useState(0); // 错误梯度（规格 3.2：2 次提示时间同步，3 次降级）
  const [simulating, setSimulating] = useState(null); // 'passkey' | 'face' 动画中
  const [msg, setMsg] = useState(null); // { type: 'error'|'info', text }
  const [locked, setLocked] = useState(null); // 锁定到期时间
  const [leftSec, setLeftSec] = useState(0); // 会话剩余秒
  const [finalizing, setFinalizing] = useState(false);
  const timersRef = useRef([]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

  // 打开时创建验证会话（时机 1）
  useEffect(() => {
    if (!open || !factors?.length) return;
    const res = createVerifySession(factors);
    if (!res.ok && res.locked) { setLocked(res.until); return; }
    setSession({ sessionId: res.sessionId, items: res.items, expiresAt: res.expiresAt });
    setActiveItem(null); setCode(''); setSmsSent(false); setCountdown(0);
    setGaErrors(0); setSimulating(null); setMsg(null); setLocked(null); setFinalizing(false);
    return clearTimers;
  }, [open, factors]);

  // 会话 10 分钟倒计时（S-2 超时全作废）
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const left = Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000));
      setLeftSec(left);
      if (left <= 0) {
        setSession(null);
        setMsg({ type: 'error', text: t('验证会话已超时，请重新开始') });
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [session, t]);

  // 发送短信倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const iv = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [countdown]);

  const sendCode = useCallback(() => {
    setSmsSent(true);
    setCountdown(60);
    console.log('[Mock] 2FA 验证码（sms/email 演示统一）: 123456');
    setMsg({ type: 'info', text: t('演示模式：验证码为 123456') });
  }, [t]);

  const handleSubmitItem = async (type) => {
    if (!session) return;
    setMsg(null);
    const isCodeFactor = type === 'sms' || type === 'email';
    if (isCodeFactor && !smsSent) { sendCode(); return; }
    const res = await submitVerifyItem(session.sessionId, type, code);
    if (!res.ok) {
      if (res.reason === 'expired') { setSession(null); setMsg({ type: 'error', text: t('验证会话已超时，请重新开始') }); return; }
      if (res.reason === 'too_many_failures') {
        setSession(null);
        setMsg({ type: 'error', text: t('安全验证失败次数过多，请 2小时后再试。') });
        return;
      }
      if (type === 'ga') {
        const n = gaErrors + 1;
        setGaErrors(n);
        setCode('');
        if (n >= 3) setMsg({ type: 'error', text: t('多次验证失败，可切换其他验证方式') });
        else if (n === 2) setMsg({ type: 'error', text: t('验证码错误，请检查设备时间同步后重试') });
        else setMsg({ type: 'error', text: t('验证码错误，请重试') });
      } else {
        setMsg({ type: 'error', text: type === 'email' ? t('邮箱验证码不正确，请重新输入') : t('短信验证码不正确，请重新输入') });
        setCode('');
      }
      return;
    }
    // 单项通过：仅重置该项，不影响已完成项（规格 4.4）
    setCode(''); setActiveItem(null); setMsg(null);
    markDone(type);
  };

  const markDone = (type) => {
    setSession(s => s ? { ...s, items: s.items.map(i => i.type === type ? { ...i, done: true } : i) } : s);
  };

  // 模拟生物识别（passkey / face）：点击条目即触发，动画完成后直接标记通过（原型语义）
  const runBiometricSim = (type) => {
    if (!session || simulating) return; // simulating guard：动画中忽略重复点击，防多 timer 竞态
    setSimulating(type);
    later(() => {
      const res = completeVerifyItem(session.sessionId, type);
      setSimulating(null);
      if (res.ok) { setActiveItem(null); setMsg(null); markDone(type); }
      else setMsg({ type: 'error', text: t('验证会话已超时，请重新开始') });
    }, type === 'passkey' ? 1600 : 2200);
  };

  // 全部完成 → 最终确认（时机 3）
  const handleFinalize = () => {
    if (!session) return;
    setFinalizing(true);
    const res = finalizeVerifySession(session.sessionId);
    setFinalizing(false);
    if (!res.ok) { setSession(null); setMsg({ type: 'error', text: t('验证会话已超时，请重新开始') }); return; }
    setSession(null);
    onVerified && onVerified(res.token);
  };

  if (!open) return null;

  // 锁定态（X-5：失败 5 次锁安全中心修改权限 2h）
  if (locked) {
    return (
      <>
        <div className="sheet-mask" />
        <div className="sheet svs-sheet">
          <div className="sheet-header">
            <h3>{t('安全验证')}</h3>
            <button className="svs-close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="svs-locked">
            <AlertTriangle size={28} />
            <p>{t('安全验证失败次数过多，请 2小时后再试。')}</p>
            <p className="text-muted text-sm">{t('如需协助请联系客服')}</p>
          </div>
        </div>
      </>
    );
  }

  const items = session?.items || [];
  const doneCount = items.filter(i => i.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <>
      <div className="sheet-mask" />
      <div className="sheet svs-sheet">
        <div className="sheet-header">
          <h3>{t('安全验证')}</h3>
          <div className="svs-header-right">
            {session && <span className="svs-timer">{String(Math.floor(leftSec / 60)).padStart(2, '0')}:{String(leftSec % 60).padStart(2, '0')}</span>}
            <button className="svs-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <p className="text-muted text-sm svs-sub">
          {subtitle || t('需要完成以下 N 项验证').replace('N', items.length)}
          <span className="svs-progress"> {doneCount}/{items.length}</span>
        </p>

        <div className="svs-list">
          {items.map(item => {
            const meta = FACTOR_META[item.type];
            const Icon = meta.icon;
            // 生物识别项：simulating 即视为展开态（点击条目直接进入验证动画）
            const isActive = (activeItem === item.type || simulating === item.type) && !item.done;
            const isBio = item.type === 'passkey' || item.type === 'face';
            return (
              <div key={item.type} className={`svs-item ${item.done ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                <button
                  className="svs-item-head"
                  onClick={() => {
                    if (item.done) return;
                    if (isBio) runBiometricSim(item.type); // 展开即验证：生物识别无第二选项，免中间按钮
                    else setActiveItem(isActive ? null : item.type);
                  }}
                  disabled={item.done}
                >
                  <span className={`svs-item-icon ${item.done ? 'done' : ''}`}>
                    {item.done ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className="svs-item-text">
                    <strong>{t(meta.title)}</strong>
                    <span className="text-muted text-sm">{item.done ? t('已完成') : t(meta.desc)}</span>
                  </span>
                  {item.done
                    ? <span className="svs-item-state done">{t('已完成')}</span>
                    : <span className="svs-item-state">{isActive ? '' : t('待验证')}</span>}
                </button>

                {isActive && (item.type === 'sms' || item.type === 'email') && (
                  <div className="svs-item-body">
                    <div className="svs-code-row">
                      <input
                        className="form-input svs-code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={t('请输入6位验证码')}
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                      {smsSent
                        ? <button className="btn btn-secondary btn-sm" disabled={countdown > 0} onClick={sendCode}>
                            {countdown > 0 ? `${countdown}s` : <><RefreshCw size={13} /> {t('重新发送')}</>}
                          </button>
                        : <button className="btn btn-primary btn-sm" onClick={sendCode}>{t('发送验证码')}</button>}
                    </div>
                    <button className="btn btn-primary btn-sm svs-item-verify" disabled={code.length !== 6} onClick={() => handleSubmitItem(item.type)}>{t('验证')}</button>
                    {item.type === 'email' && (
                      <button className="svs-link" onClick={() => setMsg({ type: 'info', text: t('邮箱验证码接收异常？请联系客服协助处理') })}>
                        <LifeBuoy size={13} /> {t('无法接收邮件？')}
                      </button>
                    )}
                  </div>
                )}

                {isActive && item.type === 'ga' && (
                  <div className="svs-item-body">
                    <div className="svs-code-row">
                      <input
                        className="form-input svs-code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={t('请输入6位验证码')}
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <p className="text-muted text-sm">{GA_DEMO_MODE ? t('演示模式：验证码为 123456') : t('验证码 30 秒刷新一次，请以当前显示为准')}</p>
                    <button className="btn btn-primary btn-sm svs-item-verify" disabled={code.length !== 6} onClick={() => handleSubmitItem('ga')}>{t('验证')}</button>
                    {onUnavailable && (
                      <button className="svs-link" onClick={() => { setSession(null); onUnavailable(); }}>
                        <LifeBuoy size={13} /> {t('无法获取验证码？')}
                      </button>
                    )}
                  </div>
                )}

                {isActive && isBio && (
                  <div className="svs-item-body">
                    <div className={`svs-sim ${item.type}`}>
                      <div className="svs-sim-ring">
                        {item.type === 'passkey' ? <Fingerprint size={34} /> : <ScanFace size={34} />}
                        <div className="svs-sim-scan" />
                      </div>
                      <p className="text-sm">{item.type === 'passkey' ? t('正在验证生物识别…') : t('正在进行活体检测，请正对屏幕…')}</p>
                      <p className="text-muted text-sm">{t('演示模式：模拟系统生物识别面板')}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {msg && <div className={`svs-msg ${msg.type}`}>{msg.text}</div>}

        <button className="btn btn-primary btn-full svs-confirm" disabled={!allDone || finalizing || !session} onClick={handleFinalize}>
          {allDone ? t('确认') : t('请先完成全部验证')}
        </button>
        <p className="text-muted text-sm svs-note">{t('验证通过后方可继续操作；会话有效期 10 分钟')}</p>
      </div>
    </>
  );
}
