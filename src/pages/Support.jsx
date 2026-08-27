import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Headphones, UserRound, UserCog } from 'lucide-react';
import { currentUser, getLatestUserTicket, sendUserMessage, appendBotMessage, escalateToStaff } from '../mock/data';
import { useLang } from '../i18n';

// 在线客服（2026-08-24 · 双端最小闭环）：两级服务模型——
// ①智能助手（bot 自助层）：常见问题秒答，会话落库但后台工作台不可见；
// ②「转人工」：status → open 进入后台「客户消息」队列，此后消息直通人工、助手停答。
// 会话持久化于 data.js supportTickets（按 currentUser 归属，刷新不失）；open 态 2.5s 轮询拉取客服回复
// （mock 无推送通道，对齐后台广播调度器先例；接后端由 WebSocket 替换）。

const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function Support({ navigate, goBack }) {
  const { t } = useLang();

  // 智能助手话术（仅 bot 自助阶段应答；口径=助手建议转人工，不做虚假承诺）
  const BOT_REPLIES = [
    t('收到您的咨询。一般账户与操作类问题可查看「帮助中心」；涉及额度、SPV 安排等专业事项，建议点击下方「转人工」获取准确答复。'),
    t('这个问题我记录下来了。为避免答复不准确，建议您转接人工客服，或联系您的专属客户经理跟进。'),
    t('如情况紧急，您也可以直接拨打客服热线 400-888-0000。'),
  ];
  const WELCOME = {
    from: 'bot',
    text: t('您好，我是平台智能助手。常见问题可以直接问我；如需人工服务，请点击下方「转人工」。'),
    time: nowTime(),
  };

  // 会话状态统一从数据层同步（单机 state 只做展示镜像）
  const [ticket, setTicket] = useState(() => getLatestUserTicket(currentUser.id));
  const [messages, setMessages] = useState(() => {
    const t0 = getLatestUserTicket(currentUser.id);
    return t0 ? [...t0.messages] : [WELCOME];
  });
  const [input, setInput] = useState('');
  const replyIdx = useRef(0);
  const bottomRef = useRef(null);

  const status = ticket?.status || 'new'; // new=无会话(本地欢迎) / bot / open / closed

  const syncTicket = (t0) => {
    setTicket(t0 ? { ...t0, messages: [...t0.messages] } : null);
    setMessages(t0 ? [...t0.messages] : [{ ...WELCOME, time: nowTime() }]);
  };
  const reload = () => syncTicket(getLatestUserTicket(currentUser.id));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // open 态轮询客服回复（closed/bot/new 不轮询）
  useEffect(() => {
    if (status !== 'open') return undefined;
    const timer = setInterval(reload, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ticket?.id]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const t0 = sendUserMessage(currentUser.id, currentUser.name, text);
    setInput('');
    if (t0.status === 'bot') {
      // 智能助手延迟应答（落库，转人工后客服可见完整上下文）
      const idx = replyIdx.current;
      setTimeout(() => {
        appendBotMessage(t0.id, BOT_REPLIES[idx % BOT_REPLIES.length]);
        replyIdx.current = idx + 1;
        reload();
      }, 800);
    }
    reload();
  };

  // 转人工：无活跃会话时以转接请求作为首条消息创建，再进队列
  const handleEscalate = () => {
    let t0 = ticket && ticket.status !== 'closed' ? ticket : null;
    if (!t0) t0 = sendUserMessage(currentUser.id, currentUser.name, t('请帮我转接人工客服'));
    const res = escalateToStaff(t0.id);
    if (!res.ok) return;
    reload();
  };

  const isHuman = status === 'open';
  const isClosed = status === 'closed';

  return (
    <div className="page support-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('在线客服')}</h1>
        </div>
      </div>

      <div className={`support-context ${isHuman ? 'support-context--live' : ''}`}>
        <Headphones size={16} />
        <span>
          {isHuman
            ? t('人工客服已接入，请描述您的问题，客服将尽快回复')
            : isClosed
              ? t('上一场会话已结束，重新发送消息即可开启新咨询')
              : t('智能助手为您在线服务；专业问题可随时转人工客服')}
        </span>
      </div>

      <div className="support-chat">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from === 'staff' ? 'staff' : m.from === 'user' ? 'user' : 'bot'}`}>
            {(m.from === 'bot' || m.from === 'staff') && (
              <span className={`chat-avatar ${m.from === 'staff' ? 'staff' : ''}`}>
                {m.from === 'staff' ? <UserCog size={14} /> : <Headphones size={14} />}
              </span>
            )}
            <div className="chat-bubble">
              {m.from === 'staff' && <span className="chat-sender">{t('人工客服')}{ticket?.staffName ? ` · ${ticket.staffName}` : ''}</span>}
              <span>{m.text}</span>
              <span className="chat-time">{m.time}</span>
            </div>
            {m.from === 'user' && (
              <span className="chat-avatar user"><UserRound size={14} /></span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isHuman && !isClosed && (
        <button className="support-escalate-btn" onClick={handleEscalate}>
          <UserCog size={14} /> {t('转人工客服')}
        </button>
      )}

      <div className="support-input">
        <input
          className="form-input"
          value={input}
          placeholder={isClosed ? t('会话已结束，输入新问题开启新咨询…') : isHuman ? t('请描述您的问题…') : t('请输入您的问题…')}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="support-send-btn" onClick={send} disabled={!input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
