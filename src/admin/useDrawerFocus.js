import { useEffect, useRef } from 'react';

// 抽屉无障碍焦点管理（2026-08-24 a11y 整改，配套 DESIGN.md 组件规范）：
// 打开时聚焦容器 → Tab 循环圈闭在抽屉内 → Esc 触发 onClose → 关闭时还原触发前焦点。
// 用法：
//   const drawerRef = useDrawerFocus(isOpen, handleClose);
//   <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true">
// onClose 支持分层退出（如确认态先退确认再关抽屉）：每次渲染同步最新回调，无过期闭包。
export function useDrawerFocus(open, onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const prevActive = document.activeElement;
    const rafId = requestAnimationFrame(() => ref.current?.focus());

    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const escaped = !root.contains(active);
      if (e.shiftKey && (active === first || escaped)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || escaped)) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKey);
      // 还原触发元素焦点；URL 驱动场景下 prev 可能随页面切换卸载，isConnected 兜底
      if (prevActive && prevActive.isConnected) prevActive.focus();
    };
  }, [open]);

  return ref;
}
