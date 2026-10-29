import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import {
  myFundOrders, cancelFundOrder, FUND_ORDER_STATUS, formatExactAmount, formatShares, CURRENCY_META,
} from '../mock/data';
import { useLang } from '../i18n';

// 我的交易（2026-10-28 结构重做）
// 定位：交易台账。回答三件事——有没有在途的（冻了多少、能不能撤）／那笔成交了什么价、多少钱／
// 出问题的那笔为什么。只消费 fundOrders（交易单据），与资金申请（充值/提现/换汇）分属两域。
//
// 与上一版的差别不是配色，是信息次序：
//   ① 主数字 = 这笔的结果（成交份额/回款），不再是「申购金额/份额」等字段平铺；
//   ② 状态只有「待确认」实色——在途是唯一需要行动的状态，已成交是终态，不该最响；
//   ③ 卡内保留「查看基金」，但整卡不可点：点击交易单的预期是「这笔单」，不是「这只基金」；
//   ④ 时间到分并人化，单据时间精确到秒对投资人没有意义；
//   ⑤ 已撤销/已驳回保留时间 + 数量 + 一句说明：本项目没有单据详情页，列表是唯一视图，压缩不能丢信息。

const statusMeta = {
  [FUND_ORDER_STATUS.PENDING]: { key: '待确认', cls: 'is-pending' },
  [FUND_ORDER_STATUS.CONFIRMED]: { key: '已成交', cls: 'is-done' },
  [FUND_ORDER_STATUS.REJECTED]: { key: '已驳回', cls: 'is-rejected' },
  [FUND_ORDER_STATUS.CANCELLED]: { key: '已撤销', cls: 'is-cancelled' },
};

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: FUND_ORDER_STATUS.PENDING, label: '待确认' },
  { key: FUND_ORDER_STATUS.CONFIRMED, label: '已成交' },
];

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const money = (currency, value) => {
  const symbol = CURRENCY_META[String(currency || '').toUpperCase()]?.symbol || '';
  return `${symbol} ${formatExactAmount(value)}`;
};

// 单据时间：今天 / 昨天 / 今年内 M月D日 / 跨年带年份，结尾到分。
// 秒对投资人没有决策价值；真的需要对账时看结单，不看在列表里。
function formatWhen(stamp, lang, t) {
  const matched = String(stamp || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!matched) return stamp || '—';
  const [, year, month, day, hour, minute] = matched;
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const before = new Date(now.getTime() - 86400000);
  const yesterdayKey = `${before.getFullYear()}-${pad(before.getMonth() + 1)}-${pad(before.getDate())}`;
  const dateKey = `${year}-${month}-${day}`;
  const time = `${hour}:${minute}`;
  if (dateKey === todayKey) return `${t('今天')} ${time}`;
  if (dateKey === yesterdayKey) return `${t('昨天')} ${time}`;
  if (lang === 'en') {
    const monthName = EN_MONTHS[Number(month) - 1];
    return Number(year) === now.getFullYear()
      ? `${Number(day)} ${monthName}, ${time}`
      : `${Number(day)} ${monthName} ${year}, ${time}`;
  }
  const yearPart = Number(year) === now.getFullYear() ? '' : `${year}年`;
  return `${yearPart}${Number(month)}月${Number(day)}日 ${time}`;
}

export default function FundOrders({ navigate, goBack, setToast }) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState('all');
  const [, force] = useState(0); // mock 数组变更不触发 React，撤销后强制重渲染

  const all = myFundOrders();
  const list = filter === 'all' ? all : all.filter(o => o.status === filter);
  const pendingCount = all.filter(o => o.status === FUND_ORDER_STATUS.PENDING).length;

  const handleCancel = (order) => {
    const res = cancelFundOrder(order.id);
    if (!res.ok) {
      setToast && setToast(t(res.error || '操作失败'));
      return;
    }
    setToast && setToast(t('申请已撤销'));
    force(n => n + 1);
  };

  return (
    <div className="page fund-orders-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('我的交易')}</h1>
        </div>
        {/* 只有「待确认」带计数：它是唯一需要行动的项目；给三个 tab 都标数会出现
            「全部 3 = 待确认 1 + 已成交 1」的账不平（已撤销/已驳回不在其中的） */}
        <div className="segmented-control">
          {FILTERS.map(f => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
              {t(f.label)}
              {f.key === FUND_ORDER_STATUS.PENDING && pendingCount > 0 && (
                <span className="orders-tab-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p className="text-muted">{t('暂无交易记录')}</p>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('#funds')}>{t('去看看基金')}</button>
          </div>
        </div>
      )}

      {list.map(o => {
        const meta = statusMeta[o.status] || statusMeta[FUND_ORDER_STATUS.PENDING];
        const isRedeem = o.type === 'redeem';
        const pending = o.status === FUND_ORDER_STATUS.PENDING;
        const done = o.status === FUND_ORDER_STATUS.CONFIRMED;
        const closed = o.status === FUND_ORDER_STATUS.CANCELLED || o.status === FUND_ORDER_STATUS.REJECTED;

        // 主数字：已成交看结果，在途/终态看你提交的数量。标签始终写清楚是哪一种。
        const main = isRedeem
          ? (done
            ? { k: t('回款金额'), v: money(o.currency, o.netAmount ?? o.amount ?? 0) }
            : { k: t('赎回份额'), v: `${formatShares(o.shares)} ${t('份')}` })
          : (done
            ? { k: t('确认份额'), v: `${formatShares(o.shares)} ${t('份')}` }
            : { k: t('申购金额'), v: money(o.currency, o.amount || 0) });

        const rows = [];
        if (done && !isRedeem) {
          rows.push({ k: t('申购金额'), v: money(o.currency, o.amount || 0) });
          rows.push({ k: t('认购费'), v: money(o.currency, o.feeAmount || 0) });
          rows.push({ k: t('确认净值'), v: `${o.nav}（${o.navDate}）` });
        }
        if (done && isRedeem) {
          rows.push({ k: t('赎回份额'), v: `${formatShares(o.shares)} ${t('份')}` });
          rows.push({ k: t('赎回费'), v: money(o.currency, o.feeAmount || 0) });
          rows.push({ k: t('确认净值'), v: `${o.nav}（${o.navDate}）` });
        }
        if (pending && isRedeem && o.amount != null) {
          rows.push({ k: t('预估回款'), v: money(o.currency, o.amount) });
        }

        return (
          <article key={o.id} className={`card order-card${closed ? ' is-closed' : ''}`}>
            <div className="order-head">
              <div className="order-title">
                <span className="order-name">{t(o.fundName)}</span>
                <span className="order-type">{t(isRedeem ? '赎回' : '申购')}</span>
              </div>
              <span className={`order-status ${meta.cls}`}>{t(meta.key)}</span>
            </div>

            <div className="order-sub">
              <span>{formatWhen(o.createdAt, lang, t)}</span>
              <button className="order-link" onClick={() => navigate(`#fund/${o.fundId}`)}>
                {t('查看基金')} <ChevronRight size={12} />
              </button>
            </div>

            <div className="order-main">
              <span className="order-main-k">{main.k}</span>
              <b className="order-main-v">{main.v}</b>
            </div>

            {rows.length > 0 && (
              <dl className="order-rows">
                {rows.map(row => (
                  <div className="order-row" key={row.k}>
                    <dt>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {pending && (
              <div className="order-note">
                <span>
                  {t(isRedeem ? '份额已冻结，财务确认后回款至可用余额' : '资金已冻结，财务确认后成交')}
                </span>
                <button className="order-cancel" onClick={() => handleCancel(o)}>{t('撤销申请')}</button>
              </div>
            )}

            {o.status === FUND_ORDER_STATUS.CANCELLED && (
              <p className="order-note is-quiet">
                {formatWhen(o.updatedAt, lang, t)} · {t(isRedeem ? '份额已解冻，未成交' : '资金已解冻，未成交')}
              </p>
            )}

            {o.status === FUND_ORDER_STATUS.REJECTED && (
              <p className="order-note is-danger">
                {t('驳回原因')}：{o.rejectReason ? t(o.rejectReason) : '—'}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
