// 邮件正文模板（2026-11-12 · 批次 B）
// Figma 里只有 PDF 信函、没有邮件画板，所以这套正文是按信函骨架推的：
// 品牌页眉 → 一句摘要 → 关键数字表 → 行动按钮 → 加密/有效期说明 → 法务页脚。
//
// 邮件客户端的硬约束（照做，别改）：
//   · 只用 table + 内联样式：Gmail/Outlook 会剥离 <style> 与 class；
//   · 不引外部字体、不引外部图片：字体回退到系统，图一律用文字/色块；
//   · 宽度写死 600px 并 max-width:100%：桌面邮件客户端不看 viewport；
//   · 不使用 CSS 变量、阴影、圆角大值：Outlook 渲染引擎不支持。

const BRAND_COLOR = '#3660FF';
const TEXT = '#18181B';
const MUTED = '#51525C';
const BORDER = '#E4E4E7';

export function renderEmailHtml({
  title, intro, rows = [], ctaLabel, ctaHref = '#', note = '', footer = '',
}) {
  const rowsHtml = rows.map((row, i) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:${MUTED};border-bottom:${i === rows.length - 1 ? '0' : `1px solid ${BORDER}`};">${escapeHtml(row.label)}</td>
      <td align="right" style="padding:10px 0;font-size:13px;color:${TEXT};font-weight:600;border-bottom:${i === rows.length - 1 ? '0' : `1px solid ${BORDER}`};word-break:break-word;">${escapeHtml(row.value)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="zh-HK"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F4F4F5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:8px;">
      <tr><td style="padding:24px 28px 0;">
        <div style="font-size:18px;font-weight:800;letter-spacing:.02em;color:${BRAND_COLOR};">HighBlock</div>
        <div style="font-size:10px;letter-spacing:.08em;color:#A0A0AB;margin-top:2px;">HIGHBLOCK SECURITIES LIMITED</div>
        <div style="height:1px;background:${BORDER};margin:18px 0 0;"></div>
      </td></tr>
      <tr><td style="padding:20px 28px 0;">
        <div style="font-size:17px;font-weight:700;color:${TEXT};">${escapeHtml(title)}</div>
        <div style="font-size:13px;line-height:1.7;color:${MUTED};margin-top:10px;">${escapeHtml(intro)}</div>
      </td></tr>
      <tr><td style="padding:16px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td></tr>
      <tr><td style="padding:22px 28px 0;">
        <a href="${ctaHref}" style="display:block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;text-align:center;font-size:14px;font-weight:600;padding:12px 0;border-radius:8px;">${escapeHtml(ctaLabel)}</a>
      </td></tr>
      <tr><td style="padding:12px 28px 0;">
        <div style="font-size:11px;line-height:1.7;color:#8B8B93;">${escapeHtml(note)}</div>
      </td></tr>
      <tr><td style="padding:20px 28px 24px;">
        <div style="height:1px;background:${BORDER};margin-bottom:12px;"></div>
        <div style="font-size:10px;line-height:1.7;color:#8B8B93;">${escapeHtml(footer)}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
