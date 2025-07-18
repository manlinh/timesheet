const GITHUB_TOKEN = "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";
const REPO_OWNER = "manlinh";
const REPO_NAME = "timesheet";
const FILE_MESSAGES = "messages.json";
const FILE_SCHEDULE = "schedule.json";
let currentUser = "";

function login() {
  currentUser = document.getElementById("username").value.trim();
  if (!currentUser) return alert("請輸入使用者名稱！");
  document.getElementById("login-container").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("welcome").innerText = "👋 你好，" + currentUser;
}

function showMessages() {
  fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_MESSAGES}`)
    .then(res => res.json())
    .then(data => {
      let html = "<h3>留言板</h3><div id='message-board'>";
      data.forEach(msg => {
        html += `<p><strong>${msg.user}:</strong> ${msg.message}</p>`;
      });
      html += "</div>";
      html += "<textarea id='newMsg'></textarea><br/>";
      html += "<button onclick='postMessage()'>送出留言</button>";
      document.getElementById("content").innerHTML = html;
    });
}

function postMessage() {
  const msg = document.getElementById("newMsg").value;
  if (!msg) return;
  fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_MESSAGES}`)
    .then(res => res.json())
    .then(data => {
      data.push({ user: currentUser, message: msg, time: Date.now() });
      uploadToGitHub(FILE_MESSAGES, data);
    });
}

function showSchedule() {
  fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_SCHEDULE}`)
    .then(res => res.json())
    .then(data => {
      let html = "<h3>總日程表</h3><table id='schedule-table'><tr><th>日期</th><th>時間</th><th>內容</th><th>備註</th></tr>";
      data.forEach(row => {
        html += `<tr><td>${row.date}</td><td>${row.time}</td><td>${row.course}</td><td>${row.note}</td></tr>`;
      });
      html += "</table>";
      html += "<h4>新增項目</h4>";
      html += `日期：<input id='sdate' type='date'> 時間：<input id='stime' type='time'> 課程：<input id='scourse'> 備註：<input id='snote'>`;
      html += "<button onclick='addSchedule()'>新增</button>";
      document.getElementById("content").innerHTML = html;
    });
}

function addSchedule() {
  const date = document.getElementById("sdate").value;
  const time = document.getElementById("stime").value;
  const course = document.getElementById("scourse").value;
  const note = document.getElementById("snote").value;
  if (!date || !time || !course) return alert("請填寫完整資料");
  fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_SCHEDULE}`)
    .then(res => res.json())
    .then(data => {
      data.push({ date, time, course, note });
      uploadToGitHub(FILE_SCHEDULE, data);
    });
}

function uploadToGitHub(file, content) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
  fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${file}`, {
    method: "PUT",
    headers: {
      "Authorization": "token " + GITHUB_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Update ${file}`,
      content: encoded,
      sha: null
    })
  }).then(res => {
    if (res.ok) alert("✅ 更新成功！");
    else alert("❌ 更新失敗");
  });
}

function downloadData() {
  window.open(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_SCHEDULE}`);
}
