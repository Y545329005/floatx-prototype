import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   单据查看器（2026-11-20）

   结单是一份 A4 规格的文档，不是「为手机重画的一页」。所以在手机上
   保留纸面排版、给一个查看态：默认 100%（先看清字），需要通览时切「适应宽度」。

   为什么默认不是适应宽度：430px 上 210mm 要缩到 0.53，8pt 正文变 4.2pt，
   那不是「小」，是不可读。宁可横向拖动。

   生产接 PDF 时只替换这一层容器，.doc-sheet 本体不动。
   ───────────────────────────────────────────────────────────── */

const A4_WIDTH_PX = 794; // 210mm @96dpi

// contentWidth：内容的规格宽度（px），默认 A4。规格由调用方声明——A4 单据不传（794），
// 流式表格类内容传其 CSS min-width 规格值（如个人信息收集清单表 640），canvas 内联宽度随之，
// 适应宽度的缩放比也按它计算。打印不受影响：print 段 .doc-canvas width:auto !important 收口。
export default function DocViewport({ children, contentWidth = A4_WIDTH_PX }) {
  const { t } = useLang();
  const ref = useRef(null);
  const [fit, setFit] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fit) { setScale(1); return; }
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      // 向下取两位：四舍五入会留下 1-3px 的横向滚动（357 > 354），看着像没对齐
      if (width > 0) setScale(Math.min(1, Math.max(0.3, Math.floor((width / contentWidth) * 100) / 100)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [fit, contentWidth]);

  return (
    <div className="doc-viewport" ref={ref}>
      <div className="doc-canvas" style={{ width: contentWidth, zoom: scale }}>{children}</div>
      <div className="doc-zoom" role="group" aria-label={t('缩放')}>
        <button type="button" aria-pressed={!fit} onClick={() => setFit(false)}>{t('100%')}</button>
        <button type="button" aria-pressed={fit} onClick={() => setFit(true)}>{t('适应宽度')}</button>
      </div>
    </div>
  );
}
