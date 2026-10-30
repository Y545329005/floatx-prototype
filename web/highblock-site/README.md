# HighBlock Securities website

繁體中文與英文的零第三方依賴靜態網站。交付版本：2026-10-30 v5。

公開 dev 網址：https://highblock-securities-dev.pages.dev/

## 開發

使用 Node.js 24：

```sh
npm run build
npm run check
npm run dev
```

預覽 `http://127.0.0.1:8791/`；修改來源後重新 build 再刷新，無自動熱更新。換埠可用 `npm run dev -- --port 8792`。

## 修改來源

| 內容 | 來源 |
| --- | --- |
| 首頁、關於、聯絡、共用導覽與頁尾 | `build.mjs` 內 `copy.zh` / `copy.en` 及 render 函式 |
| 產品與服務 | `src/services-zh.html`、`src/services-en.html` |
| 白色 App 示意界面 | `src/services-devices.mjs`、`dist/assets/services-devices.css` |
| 資訊頁四類內容與基金動態空白配圖 | `src/information-hub.mjs`；圖片佔位類別為 `ih-image-placeholder` |
| 資訊頁分欄與分類切換 | `dist/assets/information-hub.css`、`dist/assets/information-hub.js` |
| 投資理念研究切面 | `src/research-planes.mjs`、`dist/assets/research-planes.js` |
| 全站樣式與入場互動 | `dist/assets/site.css`、`dist/assets/site.js` |
| 入場聲明文字 | `src/website-notice.json`，build 生成 `dist/assets/website-notice.js` |
| 首頁金色流線 | `dist/assets/motion-flow.js`、`dist/assets/financial-motion.js` |
| 完整法律文件 | `dist/legal/*.html`，直接維護 |
| Logo 和服務頁圖片 | `dist/assets/highblock-logo.svg`、`dist/assets/services-original/` |

**`dist/` 是來源的一部分，必須保留並提交。** 不可清空 dist 再構建。build 產生主要頁面、轉址頁、入場文案 JS、研究切面 CSS 與 favicon；其餘圖片、樣式、腳本及法律正文不由 build 還原。

`npm run check` 檢查語法、本地引用、錨點、重複 ID 與 ARIA 對應。`npm run verify:baseline` 保留 2026-10-28 歷史版本，不作本次驗收。

## 目前內容與發布

資訊頁為 `news.html` / `news.en.html`，含 `#licensing`、`#fund-updates`、`#risk-disclosures`、`#website-terms`。舊 compliance 轉至持牌資料；舊 news-licensing 轉至基金動態。語言切換保留所選分類。

基金動態牌照配圖改為「圖片待補 / Image placeholder」。網站條款分類的入場聲明重閱區塊與右下角法律浮動入口均已移除。法律全文保留在資訊頁及頁尾；首頁與一般業務頁的入場確認維持原有機制。

聯絡資料仍為「待輸入」，表單 disabled 且沒有後端；App 商店顯示即將上線。開發網站保留 `noindex,nofollow`。

Cloudflare Pages 項目 `highblock-securities-dev` 使用 Direct Upload，Production branch 為 `main`。上傳完整 `dist/` 內容即可更新固定 pages.dev 網址。GitHub 尚未自動同步；`deployment/` 只提供未啟用範本。

完整交接包 `docs/` 提供本地操作、修改位置、GitHub 接入及 Cloudflare 維護說明。v5 僅整理交付文件及文字底稿，網站程式與 v4 已發布版本相同。
