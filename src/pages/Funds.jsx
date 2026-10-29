import { ChevronRight } from 'lucide-react';
import { funds, getPiStatusForUser, PI_STATUS, currentUser, getHoldings, fundMonthsLabel } from '../mock/data';
import { useLang } from '../i18n';

// 基金列表（2026-10-28 决策卡改版 · 对抗性审查后定稿）
// 1) 首期只有 4 只产品、4 种类型 —— 来源页签把列表切成 2/2，类型 chips 更是每种只剩 1 只，
//    任何筛选的结果集恒为 1 张卡。这份数据量下筛选不是能力而是噪音，故整页不设页签与 chips。
// 2) 一段卡只回答一个问题，三带结构：这是什么（名称+来源）→ 收益与风险（成对判断）→ 条款（能不能卖/买不买得起）。
//    上一版 5 个视觉带、18 个文本片段挤在 195px 里，靠的正是「每条信息一个地板」——这才是「密密麻麻」的根因。
// 3) 只留改变「点进去/不点」决定的字段。已移除：类型（名称已自带）、一句话描述（详情页职责）、
//    基金规模（与我的决定无关，且当初是为填满第三格硬塞的）。
// 4) 卡片不放净值曲线：目标回报旁边一条无坐标的净值切片会被读成「已实现业绩」，业绩只在详情页看。
// 5) 颜色只承担一个语义 —— 仅「高风险」标红，其余风险为普通文字（三档色点在中/中低同色后已退化为装饰）。
const HIGH_RISK = '高风险';

// 起投额按语言格式化：中文「HK$ 100万」与 fundSize 的「HK$ 2.4亿」同款，英文「HK$100M」与字典里
// fundSize 的英文值同款。直接用 toLocaleString 会在 1/3 列宽里折成两行（上一版折行的根因）。
function formatMinInvestment(amount, lang, unitWan) {
  if (lang === 'en') {
    // 0.5M 档也要能压缩：HK$1,500,000 会把「条款带」挤成两行
    if (amount % 100000 === 0) return `HK$${amount / 1000000}M`;
    return `HK$${amount.toLocaleString('en-US')}`;
  }
  return amount % 10000 === 0 ? `HK$ ${amount / 10000}${unitWan}` : `HK$ ${amount.toLocaleString('en-US')}`;
}

// 8-10% → 8–10%（区间号用 en dash，中英文都通）；其余文本不受影响
const prettyReturn = (v) => String(v).replace(/(\d)-(\d)/g, '$1–$2');

export default function Funds({ navigate }) {
  const { t, lang } = useLang();
  const piOk = getPiStatusForUser(currentUser.id) === PI_STATUS.APPROVED;
  const list = piOk ? funds : [];
  // 持仓标识：手里的产品 vs 陌生的产品，是列表页最强的决策信号（getHoldings 只返回本人正份额）
  const heldFundIds = new Set(getHoldings().map(h => h.fundId));

  return (
    <div className="page funds-page">
      <div className="subpage-sticky">
        <div className="page-header p-funds-head">
          <h1>{t('基金')}</h1>
          {piOk && <span className="p-funds-count">{t('{} 只产品').replace('{}', String(list.length))}</span>}
        </div>
      </div>

      {!piOk && (
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('需完成专业投资者（PI）认证后方可查看并申购基金产品')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#kyc-pi')}>{t('去认证')}</button>
        </div>
      )}

      {piOk && list.map(f => (
        <button
          key={f.id}
          className="p-funds-card"
          onClick={() => navigate(`#fund/${f.id}`)}
          aria-label={`${t(f.name)} · ${t('查看详情')}`}
        >
          <span className="p-funds-card-head">
            {/* 名称单行截断：390px 下 4 个名称都能单行，320px 窄屏长名省略，title / aria-label 保留全称 */}
            <span className="p-funds-card-name" title={t(f.name)}>{t(f.name)}</span>
            <span className={`p-funds-card-source ${f.source}`}>{t(f.source === 'self' ? '自营' : '代售')}</span>
            {heldFundIds.has(f.id) && <span className="p-funds-card-held">{t('已持有')}</span>}
            <ChevronRight size={16} />
          </span>

          <span className="p-funds-card-return">
            <span className="p-funds-card-rate">
              <span className="p-funds-card-return-value">{prettyReturn(t(f.returnValue))}</span>
              <span className={f.riskLevel === HIGH_RISK ? 'p-funds-card-risk is-high' : 'p-funds-card-risk'}>
                {t(f.riskLevel)}
              </span>
            </span>
            {/* 口径独立一行：英文「Expected annual return · Not guaranteed」与风险同行会被截断，
                而合规口径恰恰是不能被截断的那一段 */}
            <span className="p-funds-card-return-label">{t(f.returnLabel)} · {t(f.returnNote)}</span>
          </span>

          <span className="p-funds-card-facts">
            <span className="p-funds-card-fact">
              <span className="p-funds-card-fact-k">{t('锁定期')}</span>
              <span className="p-funds-card-fact-v">{fundMonthsLabel(f.lockMonths, t)}</span>
            </span>
            <span className="p-funds-card-fact">
              <span className="p-funds-card-fact-k">{t('起投')}</span>
              <span className="p-funds-card-fact-v">{formatMinInvestment(f.minInvestment, lang, t('万'))}</span>
            </span>
          </span>
        </button>
      ))}

      {piOk && list.length === 0 && (
        <div className="card reports-note"><p className="text-muted text-sm">{t('暂无基金')}</p></div>
      )}

      {piOk && list.length > 0 && (
        <p className="p-funds-footnote">{t('基金投资涉及风险，过往业绩不代表未来表现。')}</p>
      )}
    </div>
  );
}
