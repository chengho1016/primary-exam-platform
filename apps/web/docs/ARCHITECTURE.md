# 小學堂網站架構

> Long-term architecture source of truth: see `ARCHITECTURE_ROADMAP.md`. This file describes the current deployed architecture; the roadmap defines the 5-10 year platform direction and required safe migration path.

## 目標

網站已完成核心使用流程並接駁本機PostgreSQL。公開試卷、練習、錯題本、家長報告、列印及Admin頁面均使用資料庫即時資料。

Primary Exam 的長期定位不是單純做題網站，而是香港小學生學習平台：家長、學生、後台與 AI 學習系統都必須以可維護、可擴充、可商業化為最高原則。新增科目、課程、Topic、題目及教材應盡量透過資料與後台流程擴充，而不是 hard-code。

## 技術選擇

- Next.js App Router + React + TypeScript
- 純CSS設計系統，Tailwind只保留作後續工具類用途
- PostgreSQL 17作本機及正式資料庫
- Prisma ORM 7、版本化遷移及可重複執行的seed
- 伺服器端產生短效列印授權和個人水印

## 模組分層

```text
瀏覽器頁面
  ├─ 公開網站／註冊登入
  ├─ 家長及學生學習頁
  └─ Admin管理頁
        ↓
Next.js頁面、Server Actions、Route Handlers
        ↓
Data Access Layer（權限、DTO、題庫、列印、付款）
        ↓
PostgreSQL + 私有檔案儲存
```

敏感操作會在伺服器端重新檢查帳戶角色、試卷授權及資料擁有權。登入Session只在瀏覽器保存HttpOnly cookie，資料庫只保存權杖雜湊。

## 路由

| 路由 | 用途 |
|---|---|
| `/` | 公開首頁 |
| `/login`、`/register` | 登入及註冊 |
| `/dashboard` | 家長／孩子學習首頁 |
| `/papers` | 年級及科目試卷庫 |
| `/papers/[paperId]` | 試卷資料及模式選擇 |
| `/practice/[paperId]` | 15題練習、逐題批改 |
| `/print/[paperId]` | 短效水印列印預覽 |
| `/wrong-book` | 自動錯題本 |
| `/parent` | 家長學習報告 |
| `/membership` | 免費、月費及逐份購買 |
| `/admin/*` | 試卷、題庫、會員及上傳管理 |
| `/admin/curriculum` | Subject / Curriculum / Topic / KnowledgePoint 正規化狀態與課程管理 |

## 主要資料

- `User`：家長或管理員帳戶
- `ChildProfile`：一個家長可管理多個孩子
- `Paper`：完整試卷、分類、狀態和存取方式
- `Question` / `QuestionVersion`：可供抽題及批改的結構化題目與版本 trail
- `Attempt` / `AttemptAnswer`：每次15題練習及作答；新作答保存當時題目 snapshot
- `WrongBookItem`：孩子與錯題的唯一關係及錯誤次數
- `Subscription` / `PaperEntitlement`：月費或逐份購買權限
- `PrintJob`：列印授權、短效期限和水印文字
- `AdminAuditLog`：管理員修改內容的審計紀錄

## 長期資料正規化方向

目前 schema 可支援 MVP 與早期商業化，但 Subject / Topic / 教材資產仍有 legacy string/path 欄位。下一階段必須採用 side-by-side 安全正規化，而不是一次過大改：

1. 新增 `Subject`、`Curriculum`、`Topic`、`KnowledgePoint`。
2. 在 `Paper` / `Question` 加 nullable references，同時保留 `subject`、`topic`、`subtopic`。
3. backfill 現有 production data。
4. 增加 Admin 管理頁。
5. 再逐步把查詢、表單、AI 推薦及題庫抽題改用 normalized IDs。

詳細原則與 phase plan 見：

- `docs/ARCHITECTURE_ROADMAP.md`
- `docs/plans/2026-07-02-phase-1-data-normalization.md`

## 歷史作答與題目版本

Admin 可以繼續修正題目內容、答案、分數、課題或 taxonomy refs，但已完成的學生練習不可因此改變歷史語境。

現行規則：

1. `Question.contentVersion` 表示 live 題目目前版本。
2. Admin 新增題目會建立 `QuestionVersion` v1；每次編輯或 math topic rename/merge 會 version +1 並寫入新 `QuestionVersion.snapshot`。
3. `/api/practice/complete` 在提交時把當時題目內容、答案規則、paper metadata、taxonomy refs 寫入 `AttemptAnswer.questionSnapshot` 和 `questionVersion`。
4. 往後報表、AI learning report 或成績回看如要顯示歷史題目，應優先使用 `AttemptAnswer.questionSnapshot`，舊 rows 才 fallback live `Question`。

## 15題抽題

現時會從已覆核、可網上作答的題目中抽出15題；正式版本可再按試卷藍圖分配課題和難度。題目必須：

1. 已發布及完成答案覆核；
2. `onlineEligible = true`；
3. 不屬於實體量度等只適合紙本的題目；
4. 同一共享圖表不應佔用過多題數；
5. 優先加入孩子曾答錯、但不是剛剛重複出現的知識點。

## 列印安全

一般瀏覽器無法完全禁止「列印成PDF」或截圖，因此系統目標是追蹤及阻嚇未授權流傳：

- 伺服器每次建立短效`PrintJob`；
- 確認月費額度或逐份購買權；
- 每頁嵌入會員編號、日期、授權碼及用途聲明；
- 記錄建立和實際列印時間；
- 原始試卷檔案放在私有儲存，不使用永久公開網址；
- 前端只顯示「直接列印」，但不宣稱技術上絕對不可儲存。

## 尚未接駁的正式服務

- 電郵驗證、忘記密碼及多因素認證（密碼雜湊及角色權限已完成）
- 雲端託管PostgreSQL、自動備份及私有物件儲存
- 付款供應商及webhook
- OCR題目辨識工作佇列
- 完整Admin審計紀錄介面（動作紀錄已寫入資料庫）
- 兒童資料刪除、匯出及私隱同意流程
