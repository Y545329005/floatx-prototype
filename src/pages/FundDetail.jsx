import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import NavChart from '../components/NavChart';
import AgreementModal from '../components/AgreementModal';
import {
  funds, getPiStatusForUser, PI_STATUS, currentUser,
  fundRangeReturns, getHoldings, getHoldingRedeemInfo, formatShares, formatExactAmount, FUND_FEE_RATE,
  fundMonthsLabel, fundRedemptionLabel, formatFundSize,
} from '../mock/data';
import { useLang } from '../i18n';

// 基金详情（2026-10-28 决策档案改版 · 对抗性审查后定稿）
// 页面按投资者真实决策顺序排列：这是什么 → 钱怎么进出 → 凭什么信 → 下一步。
// 与列表页 p-funds-* 同一套视觉语言（白卡、左对齐、细线分隔、tabular-nums），不复用也不修改列表样式。
//
// 审查中定下的几条硬规则（改前请先读）：
// 1) 目标回报（8-10%）用墨色而非品牌蓝/绿色：它是「承诺口径」，与实际净值表现不是同一类事实；
//    实际收益才用涨跌色。列表页仍为蓝（另一会话在同一模块改动，本轮不动，属已接受的跨页不一致）。
// 2) 不标「年化」，不把目标回报折算成金额（「100 万 → 108 万」＝捏造预期收益）。
// 3) 认购费/赎回费从 FUND_FEE_RATE 派生，economics 只存管理费/表现费——账务与展示必须同源。
// 4) 第三方机构（托管/行政/审计）缺值显示「详见基金文件」，原型不编造具名机构（审核会逐一点名核查）。
// 5) 基金文件没有 url 时不渲染成按钮：点了没反应的死链比不提供更糟。
// 6) 合规声明整句收成单个 i18n key，法务定稿后只换文案、不动结构。

const RISK_HIGH = '高风险';

// 主要风险（共用 3 条）：4 只产品同为封闭式私募基金，风险结构相同；
// 逐只编写风险文案没有法务来源，等基金文件到位后再差异化（示意占位）
const KEY_RISKS = [
  '流动性风险：锁定期内不可转让、不可赎回，提前退出须管理人书面同意。',
  '估值风险：非上市资产按管理人估值，处置价可能与估值存在差异。',
  '汇率风险：非 HKD 计价份额受汇率波动影响，汇兑损益由投资者承担。',
];

// 8-10% → 8–10%（区间号用 en dash，中英文都通）
const prettyReturn = (v) => String(v).replace(/(\d)-(\d)/g, '$1–$2');
// 费率：0.01 → 1.00%，0 → 0%
// 费率一律两位小数：`rate ? ... : '0%'` 会让 0% 逃出格式，同一行出现「1.00% · 0%」
const pct = (rate) => (rate == null ? '-' : `${(rate * 100).toFixed(2)}%`);
// 起投额是金额，走全站金额口径（2 位小数）；否则与申购页的「HKD 1,000,000.00」两种写法
const hkd = (amount) => `HK$ ${formatExactAmount(amount)}`;
// 参与方：填了值的逐行展示，缺值的收成一行「详见基金文件」（逐个重复同一句占位＝空区块）
const PARTY_ROWS = [
  { key: 'custodian', label: '托管人' },
  { key: 'administrator', label: '行政管理人' },
  { key: 'auditor', label: '审计师' },
];

// 开放日枚举 → 文案（数据层存枚举，后台将来用下拉框，不填死文本）
const OPEN_FREQ = {
  'quarterly-start': '每季度首个营业日',
  'quarterly-end': '每季度最后营业日',
  'semi-annual-start': '每半年首个营业日',
};

export default function FundDetail({ id, navigate, goBack }) {
  const { t, lang } = useLang();
  const fund = funds.find(f => f.id === id) || funds[0];
  const pi = getPiStatusForUser(currentUser.id);
  const isSelf = fund.source === 'self';
  const closed = fund.openForSubscription === false || fund.status !== 'open';
  const canSubscribe = pi === PI_STATUS.APPROVED && !closed;
  // 赎回入口只认「有没有持仓」，与 PI / 申购开放状态无关——PI 过期不该锁住卖出
  const holding = getHoldings().find(h => h.fundId === fund.id) || null;
  const redeemInfo = holding ? getHoldingRedeemInfo(holding) : null;
  const canRedeem = !!holding && redeemInfo.redeemable > 0;
  const ranges = fundRangeReturns(fund.navSeries);
  // 首屏双数字（学富途）：左=目标回报（承诺口径），右=单位净值。
  // 净值日期只到「月」——私募是周/月估值，写到「日」是假精度。
  const lastNav = fund.navSeries[fund.navSeries.length - 1];
  const now = new Date();
  const navYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const navCurrency = fund.navMeta?.currency || 'HKD';

  // 基金文件直接打开全文（应用市场审核会逐份点开，这是硬要求）；
  // 文档 type 与协议 id 有一处不同名，需映射
  const [legalDoc, setLegalDoc] = useState(null);
  // 折叠（2026-10-28 二轮「学富途」）：条款细则默认收起，费用/锁定期/到账常显——
  // 页面 2036px 里条款卡占 600px，是「长」的主因；但费用与锁定期不能藏到页签里，只能同屏折叠。
  const [termsOpen, setTermsOpen] = useState(false);
  // 档案卡只有一个折叠（2026-10-28 三轮）：托管人/审计师 + 平台条款收在同一个展开区里，
  // 不套第二层折叠——两层折叠叠在一起，用户不知道点哪个才能找到文件。
  const [archiveOpen, setArchiveOpen] = useState(false);
  // 换基金时收起：路由只是换参数，组件实例不重建，不清的话 f1 展开的条款会带到 f3
  useEffect(() => { setTermsOpen(false); setArchiveOpen(false); }, [fund.id]);
  const LEGAL_ID = { 'terms-of-use': 'user-agreement', 'privacy-policy': 'privacy-policy', 'risk-disclosure': 'risk-disclosure' };
  const openLegal = (type) => setLegalDoc(LEGAL_ID[type] || type);

  const parties = fund.parties || {};
  const dealing = fund.dealing || {};
  const economics = fund.economics || {};
  const fundDocs = fund.fundDocuments || [];
  const filledParties = PARTY_ROWS.filter(p => parties[p.key]);
  const missingPartyLabels = PARTY_ROWS.filter(p => !parties[p.key]).map(p => t(p.label)).join(' / ');

  return (
    <div className="page fund-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#funds')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t(fund.name)}</h1>
        </div>
      </div>

      {/* 结论卡：一句话标签行 → 目标回报 → 三条关键事实（锁定期/起投/期限） */}
      <div className="card p-fund-detail-card">
        {/* 分隔符交给 CSS ::before：英文标签会换行，DOM 里的「·」会变成行尾孤立符号 */}
        <div className="p-fund-detail-tags">
          <span className={`p-fund-detail-source ${fund.source}`}>{t(isSelf ? '自营' : '代售')}</span>
          <span>{t(fund.type)}</span>
          <span className={fund.riskLevel === RISK_HIGH ? 'p-fund-detail-risk is-high' : 'p-fund-detail-risk'}>
            {t(fund.riskLevel)}
          </span>
          <span className={closed ? 'p-fund-detail-state' : 'p-fund-detail-state is-open'}>
            <i className="p-fund-detail-dot" aria-hidden="true" />
            {closed ? t('已结束') : t('可申购')}
          </span>
        </div>

        <p className="p-fund-detail-desc">{t(fund.description)}</p>

        <div className="p-fund-detail-hero-row">
          <div className="p-fund-detail-target">
            <span className="p-fund-detail-target-label">
              {t(fund.returnLabel)} · {t(fund.returnNote)} · {t('不代表实际收益')}
            </span>
            <span className="p-fund-detail-target-value">{prettyReturn(t(fund.returnValue))}</span>
          </div>
          <div className="p-fund-detail-nav">
            <span className="p-fund-detail-nav-label">{t('单位净值')} · {navCurrency} {t('份额')}</span>
            <span className="p-fund-detail-nav-value">{lastNav.toFixed(3)}</span>
            <span className="p-fund-detail-nav-date">{t('截至')} {navYm}</span>
          </div>
        </div>

        <div className="p-fund-detail-facts">
          <div><span>{t('锁定期')}</span><strong>{fundMonthsLabel(fund.lockMonths, t)}</strong></div>
          <div><span>{t('起投')}</span><strong>{hkd(fund.minInvestment)}</strong></div>
          <div><span>{t('期限')}</span><strong>{fundMonthsLabel(fund.termMonths, t)}</strong></div>
        </div>

        {/* 持仓降为一行静态事实（2026-10-28 五轮）：底栏已有赎回入口，这里再做一条可点卡片
            等于第二个入口。信息要留——「我持有多少、能不能卖」是持仓人看这一页的第一诉求。 */}
        {holding && redeemInfo && (
          <p className="p-fund-detail-holdingline">
            <span className="p-fund-detail-holdingline-k">{t('我的持仓')}</span>
            <strong>{formatShares(holding.shares)} {t('份')}</strong>
            <span>
              {redeemInfo.redeemable >= holding.shares
                ? `· ${t('全部可赎回')}`
                : redeemInfo.redeemable > 0
                  ? `· ${t('可赎回')} ${formatShares(redeemInfo.redeemable)} ${t('份')}`
                  : `· ${redeemInfo.earliestUnlock ? `${t('锁定期至')} ${redeemInfo.earliestUnlock}` : t('暂无可赎回份额')}`}
            </span>
          </p>
        )}
      </div>

      <div className="card p-fund-detail-card">
        <div className="p-fund-detail-cardhead">
          <h3>{t('净值走势')}</h3>
        </div>
        <NavChart
          navSeries={fund.navSeries}
          ranges={ranges}
          currency={fund.navMeta?.currency || 'HKD'}
          cadence={fund.navMeta?.cadence || 'weekly'}
          lastNavDate={fund.navMeta?.lastNavDate || null}
        />
      </div>

      {/* 交易条款：申购/赎回两组，标签左、值右（不再用居中 3 列网格——上一版 9 格里 4 格折行） */}
      <div className="card p-fund-detail-card">
        <div className="p-fund-detail-cardhead">
          <h3>{t('交易条款')}</h3>
        </div>

        {/* 常显 4 行：锁定期 / 起投 / 费率 / 到账 —— 覆盖「钱怎么进出」的全部关键项。
            细则（币种、管理费、开放日、确认日、通知期、风险全文）收进折叠，但不进页签、不跳转。 */}
        <dl className="p-fund-detail-rows">
          <div><dt>{t('锁定期')}</dt><dd>{fundMonthsLabel(fund.lockMonths, t)}</dd></div>
          <div><dt>{t('起投')}</dt><dd>{hkd(fund.minInvestment)}</dd></div>
          <div>
            <dt>{t('费率')}</dt>
            <dd>{t('认购费')} {pct(FUND_FEE_RATE.subscribe)} · {t('赎回费')} {pct(FUND_FEE_RATE.redeem)}</dd>
          </div>
          <div><dt>{t('到账')}</dt><dd>{fundRedemptionLabel(fund.redemptionDays, fund.redemptionMode, t)}</dd></div>
          <div><dt>{t('主要风险')}</dt><dd className="is-empty">{t('流动性 · 估值 · 汇率')}</dd></div>
        </dl>

        {termsOpen && (
          <div className="p-fund-detail-more">
            <dl className="p-fund-detail-rows">
              <div><dt>{t('币种')}</dt><dd>{fund.currency.join(' · ')}</dd></div>
              <div>
                <dt>{t('管理费与表现费')}</dt>
                <dd>
                  {economics.managementFeePct == null && economics.performanceFeePct == null
                    ? t('详见基金文件')
                    : `${t('{}/年').replace('{}', `${economics.managementFeePct}%`)} · ${t('{}（高水位）').replace('{}', `${economics.performanceFeePct}%`)}`}
                </dd>
              </div>
              <div>
                <dt>{t('开放日与确认日')}</dt>
                <dd>
                  {`${dealing.openFrequency ? t(OPEN_FREQ[dealing.openFrequency]) : t('详见基金文件')} · T+${dealing.confirmDays ?? '-'}`}
                </dd>
              </div>
              <div>
                <dt>{t('最低持有期与通知期')}</dt>
                <dd>
                  {`${fundMonthsLabel(fund.minHoldMonths, t)} · ${dealing.redemptionNoticeDays ? t('{} 天').replace('{}', dealing.redemptionNoticeDays) : t('详见基金文件')}`}
                </dd>
              </div>
            </dl>

            {/* 不再重复「主要风险」组标题：常显行已经叫这个名字，展开后直接接全文 */}
            <ul className="p-fund-detail-risks">
              {KEY_RISKS.map(k => <li key={k}>{t(k)}</li>)}
            </ul>
          </div>
        )}

        <button
          type="button"
          className="p-fund-detail-toggle"
          aria-expanded={termsOpen}
          onClick={() => setTermsOpen(v => !v)}
        >
          <span>{termsOpen ? t('收起') : t('全部条款与风险（含费用明细）')}</span>
          <ChevronDown size={16} className={termsOpen ? 'is-open' : ''} />
        </button>
      </div>

      {/* 基金档案与文件（2026-10-28 三轮）：常显只留管理人 + 基金文件；
          托管人/行政管理人/审计师与平台条款收进同一个折叠（一层，不套娃）。
          托管/审计是尽调信息，机构客户会看，首屏不需要——富途也把这类内容收在「简况」页签里。 */}
      <div className="card p-fund-detail-card">
        <div className="p-fund-detail-cardhead">
          <h3>{t('基金档案与文件')}</h3>
        </div>

        <dl className="p-fund-detail-rows">
          <div><dt>{t('管理人')}</dt><dd>{fund.manager}</dd></div>
          {/* 成立时间与规模是尽调信息，此前只存在于后台表单、APP 从不渲染——
              「后台能填、前台看不到」等于白填（2026-10-28 补齐） */}
          {fund.inceptionDate && <div><dt>{t('成立时间')}</dt><dd>{fund.inceptionDate}</dd></div>}
          {fund.fundSizeYi > 0 && <div><dt>{t('基金规模')}</dt><dd>{formatFundSize(fund.fundSizeYi, lang)}</dd></div>}
        </dl>

        {!isSelf && fund.managerNote && (
          <p className="p-fund-detail-disclosure">{t(fund.managerNote)}</p>
        )}

        <div className="p-fund-detail-group">{t('基金文件')}</div>
        <dl className="p-fund-detail-rows">
          {fundDocs.length === 0 ? null : fundDocs.some(d => d.url) ? fundDocs.map(d => (
            <div key={d.type}>
              <dt>{t(d.name)}</dt>
              <dd className={d.url ? '' : 'is-empty'}>
                {d.url ? <a href={d.url} target="_blank" rel="noreferrer">{t('查看')}</a> : t('联系客户经理获取')}
              </dd>
            </div>
          )) : (
            // 全部无链接时收成一行：逐行「联系客户经理获取」是纯重复
            <div>
              <dt>{fundDocs.map(d => t(d.name)).join(' · ')}</dt>
              <dd className="is-empty">{t('联系客户经理获取')}</dd>
            </div>
          )}
        </dl>

        {archiveOpen && (
          <>
            <dl className="p-fund-detail-rows">
              {filledParties.map(p => (
                <div key={p.key}><dt>{t(p.label)}</dt><dd>{parties[p.key]}</dd></div>
              ))}
              {missingPartyLabels && (
                <div>
                  <dt>{missingPartyLabels}</dt>
                  <dd className="is-empty">{t('详见基金文件')}</dd>
                </div>
              )}
            </dl>

            <p className="p-fund-detail-note">{t('平台法务文本，非本基金发售文件')}</p>
            {(fund.documents || []).map(d => (
              <button key={d.type} className="p-fund-detail-doc" onClick={() => openLegal(d.type)}>
                <FileText size={16} />
                <span>{t(d.name)}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </>
        )}
        <button
          type="button"
          className="p-fund-detail-toggle"
          aria-expanded={archiveOpen}
          onClick={() => setArchiveOpen(v => !v)}
        >
          <span>{archiveOpen ? t('收起') : t('托管人、审计师与平台条款')}</span>
          <ChevronDown size={16} className={archiveOpen ? 'is-open' : ''} />
        </button>

      </div>

      {/* 合规声明：整句一个 i18n key，等法务定稿后只替换文案（示意版本，未定稿） */}
      <p className="p-fund-detail-disclaimer">{t('本基金并非香港证监会认可基金，仅向专业投资者提供；本页资料仅供参考，不构成任何要约、招揽或投资建议。过往业绩不代表将来表现。')}</p>

      {legalDoc && <AgreementModal agreementId={legalDoc} onClose={() => setLegalDoc(null)} />}

      {/* 底部操作条：一切只允许一个主操作。
          申购可用 → 申购为主、赎回为次；否则可赎 → 赎回为主；
          否则已结束 → 不可点；否则 → PI 引导（文案区分「审核中」与「未认证」）。 */}
      <div className="bottom-action-bar p-fund-detail-cta">
        {canSubscribe && canRedeem && (
          <button className="btn btn-outline" onClick={() => navigate(`#fund-redeem/${holding.id}`)}>
            {t('赎回')}
          </button>
        )}
        {canSubscribe && (
          <button className="btn btn-primary" onClick={() => navigate(`#fund-subscribe/${fund.id}`)}>
            {t('申购')}
          </button>
        )}
        {!canSubscribe && canRedeem && (
          <button className="btn btn-primary" onClick={() => navigate(`#fund-redeem/${holding.id}`)}>
            {t('赎回')}
          </button>
        )}
        {!canSubscribe && !canRedeem && !closed && (
          <button className="btn btn-outline" onClick={() => navigate('#kyc-pi')}>
            {pi === PI_STATUS.PENDING_REVIEW ? t('PI 审核中') : t('完成 PI 认证')}
          </button>
        )}
        {closed && !canRedeem && (
          <button className="btn btn-outline" disabled>{t('已结束')}</button>
        )}
      </div>
    </div>
  );
}
