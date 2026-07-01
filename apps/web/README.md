# 小學堂試題練習平台

這是一套可在本機完整操作的小學生試題平台。現時已匯入一份小四數學卷，支援家長帳戶、15題練習、即時批改、錯題本、家長報告、水印列印及管理後台。

## 開啟網站

- 網站：<http://127.0.0.1:3001>
- 管理後台：<http://127.0.0.1:3001/admin>

本機測試帳戶：

| 身分 | 電郵 | 密碼 |
|---|---|---|
| 管理員 | `admin@local.exam` | `Admin123!` |
| 家長 | `demo@example.com` | `Parent123!` |

## 已完成

- 電郵及密碼註冊、登入、登出、資料庫Session及角色權限
- 小一至小六及科目試卷篩選
- 每份試卷自動抽出15題，伺服器批改並儲存紀錄
- 自動建立及更新錯題本
- 家長查看孩子分數、練習次數及課題弱項
- 原卷只經短效列印授權顯示，每頁動態加入會員水印
- Admin查看數據、上傳試卷、編輯試卷及題目、發布或封存內容
- PostgreSQL資料庫、Prisma遷移、seed及本機自動啟動服務

## 開發指令

```bash
corepack pnpm install
corepack pnpm db:start
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

驗證：

```bash
pnpm test
pnpm lint
pnpm build
```

## 部署備註

- 生產環境部署到 Vercel，資料庫使用 Neon PostgreSQL。
- Vercel 使用 npm 安裝，所以本目錄保留 `package-lock.json`；本機開發仍可用 `pnpm-lock.yaml`。
- 上傳試卷已改用 `POST /api/admin/papers` API Route，避免 Next.js 16 Server Action ID mismatch。
- 上傳檔案目前以 base64 儲存在 `Paper.sourceAssetPath`，不需要 Vercel Blob token。

## 正式上線前

付款供應商、電郵驗證／忘記密碼、雲端檔案儲存、自動備份及OCR批量入題仍需接駁外部服務。瀏覽器亦無法絕對禁止截圖或「列印成PDF」，所以本系統以短效授權、個人水印及列印紀錄追蹤來阻嚇外傳。

詳細設計及操作文件：

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：整體架構及安全邊界
- [docs/DATABASE_MAP.md](docs/DATABASE_MAP.md)：資料庫 table/field 解釋及未來 schema 方向
- [docs/UPLOAD_AND_PRINT_FLOW.md](docs/UPLOAD_AND_PRINT_FLOW.md)：Admin 上傳、發布、列印授權及 PDF delivery 流程
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)：程式碼結構、開發規則及新增功能流程

