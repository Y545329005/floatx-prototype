# 未啟用的 GitHub Actions 範本

這些檔案位於 `deployment/`，GitHub 不會自動執行它們。接入方式詳見交接包 `docs/04_GitHub接入與部署.md`。

| 檔案 | 用途 |
|---|---|
| `ci-root.yml` | 專案內容放在倉庫根目錄：只構建與檢查 |
| `ci-subdirectory.yml` | 專案內容放在 `highblock-site/`：只構建與檢查 |
| `pages-dev-root.yml` | 專案內容放在獨立開發倉庫根目錄：手動發布該倉庫的完整 Pages 站點 |

CI 擇一複製為倉庫根目錄的 `.github/workflows/highblock-ci.yml`。子目錄範本預設目錄為 `highblock-site/`，若改名需調整所有對應路徑。

Pages 範本只適用**獨立開發倉庫**；先填好 `EXPECTED_PREVIEW_REPOSITORY`，才複製為該倉庫的 `.github/workflows/highblock-pages-dev.yml`。它拒絕在原參照倉庫執行，並且沒有 push 自動發布觸發器。請勿拿它直接取代原站工作流。

所有範本使用 Node.js 24、`npm run build`、`npm run check`。本專案沒有第三方 npm 依賴；`dist/assets/`、`dist/legal/` 是來源檔案，必須保留並提交，不可在構建前清空 `dist/`。

GitHub 與目前 Sites 預覽沒有自動同步。這些範本的任何執行都不會更新 Sites 網址。

官方依據與版本查核日期：2026-10-28。[checkout](https://github.com/actions/checkout)、[setup-node](https://github.com/actions/setup-node)、[Pages 自訂工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
