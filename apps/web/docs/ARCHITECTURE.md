# 小學堂網站架構

## 目標

網站已完成核心使用流程並接駁本機PostgreSQL。公開試卷、練習、錯題本、家長報告、列印及Admin頁面均使用資料庫即時資料。

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

## 主要資料

- `User`：家長或管理員帳戶
- `ChildProfile`：一個家長可管理多個孩子
- `Paper`：完整試卷、分類、狀態和存取方式
- `Question`：可供抽題及批改的結構化題目
- `Attempt` / `AttemptAnswer`：每次15題練習及作答
- `WrongBookItem`：孩子與錯題的唯一關係及錯誤次數
- `Subscription` / `PaperEntitlement`：月費或逐份購買權限
- `PrintJob`：列印授權、短效期限和水印文字
- `AdminAuditLog`：管理員修改內容的審計紀錄

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
