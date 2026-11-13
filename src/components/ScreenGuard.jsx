import { useEffect, useState } from 'react';

// 防截屏演示（2026-11-13 会议拍板：截图全白方案，不做水印）。
// 边界（必须诚实）：「截图瞬间全白」是原生 App 能力（Android FLAG_SECURE 一类）——
// 截图发生时页面在前台，visibilitychange 不会触发，web 无法感知系统截屏。
// 本组件演示的是「页面切离即无内容」的意图：切走标签页/切后台时全白遮罩、回到前台恢复。
// 演示话术：切到其它标签页再切回来（当面按截图键演示会翻车）。
// 正式方案在集团 APP 壳层实现；路由挂载范围见 shell/router.jsx 的 SCREEN_GUARD_PATHS。
export default function ScreenGuard() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!hidden) return null;
  return <div className="screen-guard-mask" aria-hidden="true" />;
}
