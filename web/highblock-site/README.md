# HighBlock Securities website

繁體中文與英文的靜態網站。交接基準提交：`d304b5d09d9e935aeddd8718b50cc0ae4359a2e9`。

> **⚠️ 紅線：`dist/assets/` 與 `dist/legal/` 是手工維護的源碼，不是構建快取，禁止刪除或清空後重建。**
> `build.mjs` 只會重建一般頁面；資產與法律文件被刪即無法還原。詳見 `docs/02_修改位置與驗收.md`（存於倉庫外 `app/docs/highblock-site/`）。

公開 dev 預覽：https://highblock-securities-dev.pages.dev/

## 啟動

使用 Node.js 24，無第三方依賴：

```sh
npm run build
npm run check
npm run dev
```

本地網址為 `http://127.0.0.1:8791/`。修改源檔後重新 build 再刷新；無自動熱更新。換埠：`npm run dev -- --port 8792`。

首次接手可執行 `npm run verify:baseline`，確認構建後的 `dist/` 與交付版本完全一致；開始改內容後不再要求此項通過。

## 源碼對應

| 需求 | 檔案 |
| --- | --- |
| 主頁、關於、合規、聯絡、中英文導覽與共用頁尾文案 | `build.mjs` 的 `copy.zh` / `copy.en` 及 render 函式 |
| 產品與服務頁 | `src/services-zh.html`、`src/services-en.html` |
| App 展示界面 | `src/services-devices.mjs`、`dist/assets/services-devices.css` |
| 投資理念研究切面 | `src/research-planes.mjs`、`dist/assets/research-planes.js` |
| 全站樣式、導覽及入場確認 | `dist/assets/site.css`、`dist/assets/site.js` |
| 入場聲明文字 | `src/website-notice.json`，構建生成 `dist/assets/website-notice.js` |
| 首頁金色流場 | `dist/assets/motion-flow.js`、`dist/assets/financial-motion.js` |
| 完整法律文件 | `dist/legal/*.html`，直接維護 |
| Logo、原站照片 | `dist/assets/highblock-logo.svg`、`dist/assets/services-original/` |

**`dist/` 必須提交並保留。** 其中的 `assets/` 和 `legal/` 是本版本的源碼一部分，不可執行清空 dist 的一般框架操作。`build.mjs` 會覆蓋主頁與一般內頁、`website-notice.js`、`research-planes.css` 和 favicon；其他資產不由構建還原。

## 檢查與發布

`npm run check` 執行本地引用、錨點、ID、ARIA 與 JavaScript 語法檢查。正式部署整個 `dist/`，所有頁面保留相對路徑以支援 GitHub Pages 子目錄。

`deployment/` 提供可選 GitHub 工作流範本，沒有自動啟用。團隊原倉庫的分支、構建和發布目錄需要先確認；可把此項目放入 `highblock-site/`，透過新分支及 PR 整合。修改 GitHub 不會自動更新上述 Cloudflare Pages 預覽網址。

目前以 Cloudflare Pages Direct Upload 發布，項目名稱為 `highblock-securities-dev`，Production branch 為 `main`。更新方式見完整交接包 `docs/05_Cloudflare維護.md`。

目前聯絡資料為「待輸入」，預約表單停用且無後端，App 商店為即將上線。入場確認和完整風險全文是兩份獨立內容，右下角「免責聲明」直接前往全文。

完整交接包的 `docs/` 含修改位置、驗收和待辦清單；整合進團隊倉庫時可一併保留為項目文件。
