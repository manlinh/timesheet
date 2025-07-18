
let username = "";

function login() {
  username = document.getElementById("usernameInput").value;
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  console.log("登入成功：" + username);
}

function loadSchedule() {
  fetch('schedule.json')
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("scheduleTable");
      table.innerHTML = "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
    });
}

function syncNow() {
  alert("🛰️ 正在模擬即時同步...");
  // 在此可呼叫 GitHub API 或伺服器端 WebSocket 更新資料
}

function downloadExcel() {
  alert("🔽 下載功能建議搭配後端 API 生成 XLSX。");
}
