# 📅 夏令營行事曆系統

此專案為教師排班系統，支援多人編輯、即時更新 GitHub JSON 並自動匯出 Excel。

---

## 🔗 前端頁面

- 行事曆：  
  👉 [calendar.html](https://manlinh.github.io/timesheet/calendar.html)

- 測試 API：  
  👉 [test-calendar-api.html](https://manlinh.github.io/timesheet/test-calendar-api.html)

---

## ✅ 功能

- 月曆顯示與月份切換（7 月、8 月、9 月）
- 行程新增、修改、刪除
- 多使用者同日重疊行程
- 公開異動紀錄自動記錄
- 匯出當月行程為 Excel
- JSON 寫入透過 Vercel Serverless API

---

## 🔧 測試 API 寫入功能

你可以使用這個頁面來測試是否成功將行程寫入 GitHub JSON：

👉 [test-calendar-api.html](https://manlinh.github.io/timesheet/test-calendar-api.html)

### 成功訊號

- ✅ `📡 回應狀態：200`  
- 🔸 回應內容： `{ "ok": true }`

### 錯誤訊號範例

- ❌ 400 - Invalid JSON  
- ❌ 500 - Internal Server Error  
- ❌ 401 - Bad credentials（代表 token 設定錯誤）

---

## 📡 API Endpoint（由 Vercel 托管）

POST 到以下位置以寫入資料：
https://calendar-api-jet.vercel.app/api/update-calendar
### JSON 格式：

```json
{
  "calendar": {
    "2025-07-20": [
      { "user": "王老師", "subject": "行程測試", "time": "10:00 - 11:00" }
    ]
  },
  "log": [
    {
      "date": "2025-07-20",
      "user": "王老師",
      "subject": "行程測試",
      "time": "10:00 - 11:00",
      "action": "新增",
      "timestamp": 1750000000
    }
  ]
} ```
📁 timesheet/
├── calendar.html
├── calendar-core.js
├── style.css
├── test-calendar-api.html
├── data/
│   ├── calendar.json
│   └── calendar-log.json
└── .github/workflows/write-calendar.yml
