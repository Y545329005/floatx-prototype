import { ChevronDown, ChevronUp } from 'lucide-react';

// iOS HIG 紧凑模式 wheel picker（三个并列 column）
// 2026-11-05 从 KYCStart 抽出为共享组件：出生日期（1900~今年）与转账日期（近一年）共用。
// props:
//   value/onChange: 'YYYY-MM-DD'
//   minYear/maxYear: 年份范围（含端点）
//   initialYear: 无值时默认落到哪一年（默认 1980，超出范围时夹到范围内）

// 英文月份全名（iOS date picker 默认格式）
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 根据年月计算该月天数
function daysInMonth(year, month) {
  // month 1-12；0 月表示下一年 12 月
  const m = month === 0 ? 12 : month > 12 ? 1 : month;
  const y = month === 0 ? year - 1 : month > 12 ? year + 1 : year;
  return new Date(y, m, 0).getDate();
}

export default function DateWheelPicker({ value, onChange, t, lang, minYear = 1900, maxYear = 2026, initialYear = 1980 }) {
  const clampYear = y => Math.max(minYear, Math.min(maxYear, y));
  const now = new Date();
  const parts = (value || '').split('-');
  const curYear = parts[0] ? clampYear(parseInt(parts[0])) : clampYear(initialYear);
  // 无值时月份/日期落到今天，避免出现 5 月 15 日这类与场景无关的兜底值
  const curMonth = parseInt(parts[1]) || (now.getMonth() + 1);
  const curDay = parseInt(parts[2]) || now.getDate();

  const setDate = (y, m, d) => {
    const yy = String(y).padStart(4, '0');
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${yy}-${mm}-${dd}`);
  };

  // 增减 helper（按钮 ▲▼ 用）
  const adjust = (field, delta) => {
    if (field === 'year') {
      setDate(clampYear(curYear + delta), curMonth, curDay);
    } else if (field === 'month') {
      const newM = curMonth === 12 && delta > 0 ? 1 : curMonth === 1 && delta < 0 ? 12 : curMonth + delta;
      setDate(curYear, newM, curDay);
    } else {
      // 日在月份范围内循环
      const maxDay = daysInMonth(curYear, curMonth);
      let newD = curDay + delta;
      if (newD > maxDay) newD = 1;
      else if (newD < 1) newD = maxDay;
      setDate(curYear, curMonth, newD);
    }
  };

  const formatDisplay = {
    year: y => `${y}${lang === 'zh-CN' || lang === 'zh-HK' ? t('年') : ''}`,
    month: m => lang === 'en' ? t(MONTH_NAMES_EN[m - 1]) : `${m}${t('月')}`,
    day: d => `${d}${lang === 'zh-CN' || lang === 'zh-HK' ? t('日') : ''}`,
  };

  // 简化的 wheel column：▲ + value + ▼（2026-11-18 移除内嵌原生 <select>：真机会唤起系统选择器，
  // 与滚轮语义重复且脱离 App 视觉；步进按钮 + 弹层外的直接取值已覆盖全部路径）
  const Column = ({ field, current }) => (
    <div className="kyc-date-wheel-col">
      <button
        type="button"
        className="kyc-date-wheel-arrow"
        onClick={() => adjust(field, -1)}
        aria-label="Decrease"
      >
        <ChevronUp size={18} />
      </button>
      <div className="kyc-date-wheel-value-wrap">
        <div className="kyc-date-wheel-value">{formatDisplay[field](current)}</div>
      </div>
      <button
        type="button"
        className="kyc-date-wheel-arrow"
        onClick={() => adjust(field, 1)}
        aria-label="Increase"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );

  return (
    <div className="kyc-date-wheels">
      <Column field="year" current={curYear} />
      <Column field="month" current={curMonth} />
      <Column field="day" current={curDay} />
    </div>
  );
}
