
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("username") || "匿名";
  const tableDiv = document.getElementById("scheduleTable");
  const form = document.getElementById("addForm");

  function renderTable(data) {
    let html = "<table border='1'><tr><th>日期</th><th>時間</th><th>課程</th><th>備註</th></tr>";
    data.forEach(item => {
      html += `<tr><td>${item.date}</td><td>${item.time}</td><td>${item.course}</td><td>${item.note}</td></tr>`;
    });
    html += "</table>";
    tableDiv.innerHTML = html;
  }

  function updateJSON(newData) {
    fetch("https://api.github.com/repos/manlinh/timesheet/contents/schedule.json", {
      method: "PUT",
      headers: {
        "Authorization": "token ghp_exampletoken1234567890",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "update from frontend",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(newData)))),
        sha: window.latestSha
      })
    }).then(res => {
      if (res.ok) alert("✅ 更新成功"); else alert("❌ 更新失敗");
    });
  }

  fetch("schedule.json")
    .then(res => res.json())
    .then(data => {
      renderTable(data);
      form.addEventListener("submit", e => {
        e.preventDefault();
        const newItem = {
          date: document.getElementById("dateInput").value,
          time: document.getElementById("timeInput").value,
          course: document.getElementById("courseInput").value,
          note: document.getElementById("noteInput").value
        };
        data.push(newItem);
        renderTable(data);
        updateJSON(data);
      });
    });
});

function downloadExcel() {
  fetch("schedule.json")
    .then(res => res.json())
    .then(data => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "時數表");
      XLSX.writeFile(wb, "schedule.xlsx");
    });
}
