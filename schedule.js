document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem('username') || "未知使用者";
  document.body.insertAdjacentHTML("afterbegin", `<h3>👋 你好，${username}</h3>`);
  fetch("schedule.json")
    .then(response => response.json())
    .then(data => {
      const userData = data.filter(item => item.user === username);
      const table = ["<table><tr><th>日期</th><th>時間</th><th>內容</th><th>備註</th></tr>"];
      userData.forEach(item => {
        table.push(`<tr><td>${item.date}</td><td>${item.time}</td><td>${item.content}</td><td>${item.note}</td></tr>`);
      });
      table.push("</table>");
      document.getElementById("scheduleTable").innerHTML = table.join("");
    });
});