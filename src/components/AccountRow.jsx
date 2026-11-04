import { Check, Copy } from 'lucide-react';

// 收款账户逐行可复制（2026-11-05 从 FundOperation 抽出，KYC 银行转账认证页共用）
// 样式沿用 .fund-acct-row（全局），两页的收款账户视觉一致。
// copiedKey/onCopy 由页面维护：copy 成功后置 key，约 2.5s 后清空。
export default function AccountRow({ rowKey, label, value, mono, long, copiedKey, onCopy }) {
  const done = copiedKey === rowKey;
  return (
    <button
      type="button"
      className={`fund-acct-row${done ? ' copied' : ''}`}
      onClick={() => onCopy(rowKey, value)}
    >
      <span className="k">{label}</span>
      <span className={`v${mono ? ' mono' : ''}${long ? ' long' : ''}`}>{value}</span>
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}
