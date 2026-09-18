import { useRef, useState, useEffect, useImperativeHandle } from 'react';
import { Eraser, PenLine, RotateCcw, X } from 'lucide-react';
import { useLang } from '../i18n';

// Canvas 电子签名 v2（2026-09-15 · 全屏书写模式，对齐银行/券商 APP 通用交互）：
// 收起态 = 虚线点击区（未签）/ 签名图预览（已签）；点击进入全屏白色覆盖层书写（大区域横排），
// 底部「清空 / 取消 / 确认」三操作，确认后签名图回填收起态预览，可重签或清除。
// 对外接口不变：ref{ clear, getDataUrl, isInked } + onChange(hasInk)——SpvSign 提交与后台存证链路零改动。
// 原生 <canvas> 实现，不引第三方依赖；touchmove 以 passive:false 注册防止绘制时页面滚动。
function SignatureCanvas({ ref, onChange }) {
  const { t } = useLang();
  const fsCanvasRef = useRef(null);   // 全屏画布
  const fsWrapRef = useRef(null);     // 全屏画布容器（测实际尺寸）
  const drawing = useRef(false);
  const hasDrawn = useRef(false);     // 本次全屏会话是否落笔（确认前临时态）
  const last = useRef({ x: 0, y: 0 });
  const signedUrl = useRef(null);     // 已确认的签名图 dataURL（提交存证数据源）
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [fullscreen, setFullscreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null); // 收起态预览
  const [fsHasInk, setFsHasInk] = useState(false);    // 全屏内是否已有笔迹（控制确认按钮）

  // 全屏画布初始化：覆盖层渲染完成后按容器实际尺寸 + devicePixelRatio 高清设置
  useEffect(() => {
    if (!fullscreen) return undefined;
    const canvas = fsCanvasRef.current;
    const wrap = fsWrapRef.current;
    if (!canvas || !wrap) return undefined;
    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a2b5e';
    };
    setup();
    window.addEventListener('resize', setup);
    return () => window.removeEventListener('resize', setup);
  }, [fullscreen]);

  // Esc = 取消（对齐 AgreementModal 先例；全屏签名允许退出，非强制同意语义）
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const pos = (e) => {
    const rect = fsCanvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e) => {
    if (!drawing.current) return;
    if (e.cancelable && e.touches) e.preventDefault();
    const ctx = fsCanvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasDrawn.current) { hasDrawn.current = true; setFsHasInk(true); }
  };

  const end = () => { drawing.current = false; };

  // touchmove 必须 passive:false 才能 preventDefault（React 合成 onTouchMove 默认 passive，无法阻止滚动）
  useEffect(() => {
    if (!fullscreen) return undefined;
    const canvas = fsCanvasRef.current;
    if (!canvas) return undefined;
    canvas.addEventListener('touchmove', move, { passive: false });
    return () => canvas.removeEventListener('touchmove', move);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const clearFsCanvas = () => {
    const canvas = fsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawn.current = false;
    setFsHasInk(false);
  };

  // 确认：导出全屏画布为 PNG dataURL → 回填收起态预览 → 通知父级（未落笔时等同取消）
  const confirmFullscreen = () => {
    if (!hasDrawn.current || !fsCanvasRef.current) { setFullscreen(false); return; }
    const url = fsCanvasRef.current.toDataURL('image/png');
    signedUrl.current = url;
    setPreviewUrl(url);
    onChangeRef.current && onChangeRef.current(true);
    setFullscreen(false);
  };

  // 清除已确认签名（收起态「清除」/ 对外 ref.clear）
  const clearSignature = () => {
    signedUrl.current = null;
    setPreviewUrl(null);
    onChangeRef.current && onChangeRef.current(false);
  };

  useImperativeHandle(ref, () => ({
    clear: clearSignature,
    getDataUrl: () => signedUrl.current,
    isInked: () => !!signedUrl.current,
  }));

  return (
    <div className="signature-slot">
      {!previewUrl ? (
        <button
          type="button"
          className="signature-slot-empty"
          onClick={() => setFullscreen(true)}
        >
          <PenLine size={18} />
          <span className="signature-slot-main">{t('点击签名')}</span>
          <span className="signature-slot-sub">{t('进入全屏书写，笔迹更清晰自然')}</span>
        </button>
      ) : (
        <div className="signature-slot-preview">
          <img src={previewUrl} alt={t('电子签名')} />
          <div className="signature-slot-actions">
            <button type="button" className="signature-slot-btn" onClick={() => setFullscreen(true)}>
              <RotateCcw size={12} /> {t('重新签名')}
            </button>
            <button type="button" className="signature-slot-btn" onClick={clearSignature}>
              <Eraser size={12} /> {t('清除')}
            </button>
          </div>
        </div>
      )}

      {fullscreen && (
        <div className="signature-fs-overlay" role="dialog" aria-modal="true" aria-label={t('电子签名')}>
          <p className="signature-fs-hint">{t('请在空白区域横握书写签名')}</p>
          <div className="signature-fs-canvas-wrap" ref={fsWrapRef}>
            <canvas ref={fsCanvasRef} className="signature-fs-canvas" />
            {!fsHasInk && (
              <div className="signature-fs-placeholder">
                <PenLine size={20} />
                <span>{t('在此签名')}</span>
              </div>
            )}
          </div>
          <div className="signature-fs-actions">
            <button type="button" className="signature-fs-btn signature-fs-btn-ghost" onClick={clearFsCanvas}>
              <Eraser size={14} /> {t('清空')}
            </button>
            <button type="button" className="signature-fs-btn signature-fs-btn-ghost" onClick={() => setFullscreen(false)}>
              <X size={14} /> {t('取消')}
            </button>
            <button
              type="button"
              className="signature-fs-btn signature-fs-btn-primary"
              disabled={!fsHasInk}
              onClick={confirmFullscreen}
            >
              {t('确认签名')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignatureCanvas;
