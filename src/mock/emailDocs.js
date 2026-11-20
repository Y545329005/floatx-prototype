import { platformBrand, formatExactAmount, formatShares } from './data';

// 邮件内容构建（2026-11-12）
// 只在这里拼「一封邮件说什么」，渲染交给 emailTemplates.renderEmailHtml。
// 所有可见文案走 t()：邮件语言必须跟界面语言一致，否则客户切了英文还收到中文邮件。
//
// CTA 链接：原型没有部署地址，统一用 '#'。接真实环境时换成带签名的一次性下载链接，
// 不要把官网根域名写死在这里——下载链接必须可失效。

const CTA_HREF = '#';

export function emailFooterText(t) {
  return `${platformBrand.nameFullZh} · ${t(platformBrand.licenseType)} · ${t('中央编号')} ${platformBrand.licenseNo}`;
}

export function confirmationEmailDoc(s, t) {
  const rows = [
    { label: t('基金'), value: t(s.fundName) },
    { label: t(s.tradeType === '赎回' ? '到账金额' : '成交金额'), value: `${s.currency} ${formatExactAmount(s.amount)}` },
  ];
  if (s.shares > 0) rows.push({ label: t('份额'), value: `${formatShares(s.shares)} ${t('份')}` });
  if (s.nav > 0) rows.push({ label: t('确认净值'), value: String(s.nav) });
  if (s.settleDate) rows.push({ label: t('结算日期'), value: s.settleDate });
  rows.push({ label: t('确认单编号'), value: s.statementNo });

  return {
    subject: `${t('交易确认单')} · ${s.statementNo}`,
    title: t('您的交易确认单'),
    intro: t('您在 {date} 的{type}已确认，确认单见附件。').replace('{date}', s.date).replace('{type}', t(s.tradeType || '认购')),
    rows,
    ctaLabel: t('查看并下载确认单'),
    ctaHref: CTA_HREF,
    note: t('附件已加密，解压密码为您的出生日期（YYYYMMDD）。下载入口 30 天内有效。'),
    footer: emailFooterText(t),
  };
}

export function receiptEmailDoc(rec, t) {
  const rows = [{ label: t('单据编号'), value: rec.docNo }];
  rec.fields.forEach(f => {
    if (f.value) rows.push({ label: t(f.label), value: String(f.value) });
  });
  rows.push({ label: rec.amountLabel, value: `${rec.currency} ${rec.type.startsWith('crypto') ? formatQty(rec.amount) : formatExactAmount(rec.amount)}` });

  const introByType = {
    deposit: t('您提交的入金已确认入账，回单见附件。'),
    withdraw: t('您的提现已打款，回单见附件。到账时间以收款银行处理为准。'),
    'crypto-deposit': t('您的充币已上账，回单见附件。'),
    'crypto-withdraw': t('您的提币已完成上链，回单见附件。'),
  };

  return {
    subject: `${t(rec.title)} · ${rec.docNo}`,
    title: t(rec.title),
    intro: introByType[rec.type] || t('您的单据已生成，详见附件。'),
    rows,
    ctaLabel: t('查看回单'),
    ctaHref: CTA_HREF,
    note: t('附件已加密，解压密码为您的出生日期（YYYYMMDD）。如并非本人操作，请立即联系客户经理。'),
    footer: emailFooterText(t),
  };
}

export function periodEmailDoc(stmt, t) {
  const mandateTrades = stmt.mandate
    ? stmt.mandate.accounts.reduce((s, a) => s + a.trades.length, 0)
    : 0;
  return {
    subject: `${t('账户结单')} · ${stmt.from} – ${stmt.to}`,
    title: t('您的账户结单'),
    intro: t('您 {from} 至 {to} 的账户结单已生成，含余额、基金与委托成交、资金往来明细。')
      .replace('{from}', stmt.from)
      .replace('{to}', stmt.to),
    rows: [
      { label: t('结单期间'), value: `${stmt.from} – ${stmt.to}` },
      { label: t('期末资产总值'), value: `HKD ${formatExactAmount(stmt.closingHKD)}` },
      { label: t('基金成交'), value: t('{n} 笔').replace('{n}', String(stmt.trades.length)) },
      ...(stmt.mandate ? [{ label: t('委托成交'), value: t('{n} 笔').replace('{n}', String(mandateTrades)) }] : []),
      { label: t('资金往来'), value: t('{n} 笔').replace('{n}', String(stmt.cash.length)) },
    ],
    ctaLabel: t('查看并下载结单'),
    ctaHref: CTA_HREF,
    note: t('附件已加密，解压密码为您的出生日期（YYYYMMDD）。结单仅列示已完成记账的记录。'),
    footer: emailFooterText(t),
  };
}

function formatQty(n) {
  return String(Math.round((Number(n) || 0) * 1000000) / 1000000);
}

// 成交通知单邮件（2026-11-13 批 3 · 协议 11.2）
// 触发点：交易复核生效后。正文先行，PDF 附件位保留——正式环境由服务端生成受控 PDF 并作为附件，
// 原型阶段没有 PDF 生成能力（与基金结单同一条链路，不重复造）。
export function adviceEmailDoc(trade, account, t) {
  const amountHKD = trade.quantity * trade.price * trade.fxRate;
  const rows = [
    { label: t('委托账户'), value: account?.no || '—' },
    { label: t('证券名称'), value: `${trade.name}（${trade.symbol}）` },
    { label: t('交易方向'), value: trade.side === 'buy' ? t('买入') : t('卖出') },
    { label: t('交易日'), value: trade.tradeDate },
    { label: t('交收日'), value: trade.settleDate || '—' },
    { label: t('数量'), value: `${formatShares(trade.quantity)} ${t('股')}` },
    { label: t('成交价'), value: `${trade.price} ${trade.currency}` },
    { label: t('费用'), value: `${trade.fee || 0} ${trade.currency}` },
    { label: t('汇率（折 HKD）'), value: String(trade.fxRate) },
    { label: t('成交金额（折合 HKD）'), value: `HK$ ${formatExactAmount(amountHKD)}` },
  ];
  return {
    subject: `${t('成交通知单')} · ${trade.symbol} ${trade.tradeDate}`,
    title: t('您的委托账户成交通知'),
    intro: trade.correctionOf
      ? t('您在 {date} 的委托交易已更正成交，原成交通知作废，以本通知为准。').replace('{date}', trade.tradeDate)
      : t('您在 {date} 的委托交易已成交，明细如下。').replace('{date}', trade.tradeDate),
    rows,
    ctaLabel: t('查看成交通知单'),
    ctaHref: CTA_HREF,
    note: t('正式环境将随本邮件附上受控 PDF 成交通知单。如对成交内容有疑问，请于收到后 7 天内联系客户经理。'),
    footer: emailFooterText(t),
  };
}
