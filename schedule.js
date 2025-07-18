const user = localStorage.getItem("user");
document.title += ` - ${user}`;
fetch("schedule.json")
  .then(res => res.json())
  .then(data => {
    const userSchedule = data.filter(e => e.user === user);
    const container = document.getElementById("scheduleView");
    if (userSchedule.length === 0) {
      container.textContent = "目前沒有日程資料。";
      return;
    }
    const table = document.createElement("table");
    container.appendChild(table);
    userSchedule.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${e.date}</td><td>${e.time}</td><td>${e.course}</td><td>${e.note}</td>`;
      table.appendChild(row);
    });
  });