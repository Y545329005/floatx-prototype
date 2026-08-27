import { useState } from 'react';
import { Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { verifyAdmin } from '../mock/data';

export default function AdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const admin = verifyAdmin(username.trim(), password);
    if (!admin) {
      setError('账号或密码错误');
      return;
    }
    onLogin(admin);
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card card">
        <div className="admin-login-head">
          <span className="admin-login-logo"><ShieldCheck size={22} /></span>
          <h1>财富后台管理系统</h1>
          <p className="text-muted">内部运营 · 请使用后台账号登录</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-login-username">账号</label>
            <div className="admin-login-input">
              <User size={16} className="admin-login-input-icon" />
              <input
                id="admin-login-username"
                className="form-input"
                placeholder="请输入后台账号"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-login-password">密码</label>
            <div className="admin-login-input">
              <Lock size={16} className="admin-login-input-icon" />
              <input
                id="admin-login-password"
                type="password"
                className="form-input"
                placeholder="请输入密码"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full">登录后台</button>
        </form>

        <div className="admin-login-demo card">
          <strong>演示账号</strong>
          <span>超级管理员 admin / admin123</span>
          <span>运营 ops / ops123 · 合规 compliance / compliance123 · 客服 service / service123</span>
        </div>

        <button className="admin-login-back" onClick={onBack}>
          <ArrowLeft size={14} /> 返回前台
        </button>
      </div>
    </div>
  );
}
