
// api_schedule.js
// 將日程 schedule.json 同步寫入指定 GitHub Repo

const GITHUB_TOKEN = "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";
const REPO_OWNER = "manlinh";
const REPO_NAME = "timesheet";
const SCHEDULE_FILE = "schedule.json";

export async function updateScheduleOnGitHub(scheduleData) {
  const content = btoa(JSON.stringify(scheduleData, null, 2));
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SCHEDULE_FILE}`;

  let sha = null;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    if (response.ok) {
      const json = await response.json();
      sha = json.sha;
    }
  } catch (e) {
    console.warn("無法取得 SHA，可能是新檔案");
  }

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify({
      message: "update schedule.json",
      content,
      sha: sha || undefined
    })
  });
}
