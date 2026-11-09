import { X } from 'lucide-react';
import { useLang } from '../i18n';

// 图片放大预览（2026-08-20 凭证查看：财务核对回单/用户查看凭证共用；Escape/遮罩点击关闭）
export default function ImageLightbox({ src, title, onClose }) {
  const { t } = useLang();
  return (
    <div className="lightbox-mask" onClick={onClose}>
      <div className="lightbox" role="dialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="lightbox-head">
          <span className="lightbox-title">{title}</span>
          <button className="btn-icon" title={t('关闭')} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="lightbox-body">
          {src ? <img src={src} alt={title} /> : <p className="text-muted">{t('凭证暂不可预览')}</p>}
        </div>
      </div>
    </div>
  );
}