function updateMessages(messages) {
  const token = "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";
  const repo = "timesheet";
  const owner = "manlinh";
  const path = "messages.json";
  const content = btoa(JSON.stringify(messages, null, 2));

  fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "GET",
    headers: { Authorization: `token ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const sha = data.sha || undefined;
      return fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update messages.json",
          content: content,
          sha: sha
        })
      });
    })
    .then(res => res.json())
    .then(() => console.log("✅ 留言同步成功"))
    .catch(err => console.error("留言同步失敗", err));
}
