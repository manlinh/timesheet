
const GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // 請替換為實際 Token
const REPO_OWNER = "manlinh";
const REPO_NAME = "timesheet";

async function updateGitHubFile(path, content, message = "Update file") {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  // 取得目前檔案的 SHA
  const getResp = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  const data = await getResp.json();
  const sha = data.sha;

  // PUT 更新內容
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
      content: encodedContent,
      sha: sha,
    }),
  });

  if (res.ok) {
    alert("✅ 成功更新到 GitHub！");
  } else {
    alert("❌ 更新失敗");
  }
}

// 前端使用：確認更新留言或日程時呼叫此函式
function syncMessages(messages) {
  const json = JSON.stringify(messages, null, 2);
  updateGitHubFile("messages.json", json, "Update messages.json");
}

function syncSchedule(schedule) {
  const json = JSON.stringify(schedule, null, 2);
  updateGitHubFile("schedule.json", json, "Update schedule.json");
}
