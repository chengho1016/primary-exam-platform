# 小學生試題練習平台

網站架構、PostgreSQL資料庫及Admin第一階段已完成。第一份四年級數學卷已匯入，共46題，其中合資格題目可供15題練習。

## 資料夾

- `apps/web`：Next.js網站原型
- `content/p4-math-2324-test3`：第一份試卷的來源內容包
- `apps/web/prisma`：資料模型、遷移及初始資料匯入

## 本機啟動

```bash
cd /Users/cheng/primary-exam-platform/apps/web
pnpm install
pnpm db:start
pnpm db:migrate
pnpm db:seed
pnpm dev
```

然後開啟 `http://127.0.0.1:3001`。

示範入口：

- 會員首頁：`/dashboard`
- 15題練習：`/practice/2324-03-MA-P4`
- 水印列印：`/print/2324-03-MA-P4`
- Admin：`/admin`

Admin會從PostgreSQL讀取即時資料；生產環境的試卷上傳檔案會以 base64 data URI 儲存在 PostgreSQL `Paper.sourceAssetPath`，避免依賴 Vercel Blob。資料模型及安全邊界見 `apps/web/docs/ARCHITECTURE.md`。

## 部署及依賴管理注意

- 本機開發沿用 `pnpm`（見 `apps/web/pnpm-lock.yaml`）。如本機沒有 `pnpm`，可用 `corepack pnpm install`。
- Vercel 部署目前使用 `npm install`，因此 repo 同時保留 npm lockfile，避免清 cache 後因 transitive dependency 版本漂移而 build 失敗。
- 已透過 overrides pin `postcss@8.5.16` 及 `@hono/node-server@1.19.14`，修復已知 moderate advisories。
