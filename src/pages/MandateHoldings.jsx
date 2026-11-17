import { ArrowLeft } from 'lucide-react';
import { getMandateSummaryForUser } from '../mock/data';
import { useLang } from '../i18n';
import MandateHoldingsList from '../components/MandateHoldingsList';

// 全部委托持仓（2026-11-16）：详情页卡内只放前 5 只，全量在这里。
// 与「交易流水」同属详情页的「更多」出口，返回落回委托详情；行式与详情页同源（MandateHoldingsList）。

export default function MandateHoldings({ goBack }) {
  const { t } = useLang();
  const summary = getMandateSummaryForUser();

  if (summary.state !== 'active') {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('持仓')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
        </div>
      </div>
    );
  }

  const { account, portfolio } = summary;

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${account.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('持仓')}</h1>
        </div>
      </div>

      <div className="card">
        {portfolio.positions.length === 0
          ? <p className="text-muted text-sm">{t('暂无委托持仓')}</p>
          : <MandateHoldingsList positions={portfolio.positions} />}
      </div>
    </div>
  );
}
