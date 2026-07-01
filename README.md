# 小學生試題練習平台

網站架構、PostgreSQL資料庫及Admin第一階段已完成。第一份四年級數學卷已匯入，共46題，其中合資格題目可供15題練習。

## 資料夾

- `apps/web`：Next.js網站原型
- `content/p4-math-2324-test3`：第一份試卷的來源內容包
- `apps/web/prisma`：資料模型、遷移及初始資料匯入

## 本機啟動

```bash
cd /Users/cheng/primary-exam-platform/apps/web
corepack pnpm install
corepack pnpm db:start
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

然後開啟 `http://127.0.0.1:3001`。

示範入口：

- 會員首頁：`/dashboard`
- 15題練習：`/practice/2324-03-MA-P4`
- 水印列印：`/print/2324-03-MA-P4`
- Admin：`/admin`

Admin會從PostgreSQL讀取即時資料；生產環境的試卷上傳檔案會以 base64 data URI 儲存在 PostgreSQL `Paper.sourceAssetPath`，避免依賴 Vercel Blob。資料模型、安全邊界及流程文件見：

- `apps/web/docs/ARCHITECTURE.md`：整體架構及安全邊界
- `apps/web/docs/DATABASE_MAP.md`：資料庫 table/field 解釋及未來 schema 方向
- `apps/web/docs/UPLOAD_AND_PRINT_FLOW.md`：Admin 上傳、發布、列印授權及 PDF delivery 流程
- `apps/web/docs/PROJECT_STRUCTURE.md`：程式碼結構、開發規則及新增功能流程

## 部署及依賴管理注意

- 本機開發沿用 `pnpm`（見 `apps/web/pnpm-lock.yaml`）。如本機沒有 `pnpm`，可用 `corepack pnpm install`。
- Vercel 部署目前使用 `npm install`，因此 repo 同時保留 npm lockfile，避免清 cache 後因 transitive dependency 版本漂移而 build 失敗。
- 已透過 overrides pin `postcss@8.5.16` 及 `@hono/node-server@1.19.14`，修復已知 moderate advisories。
