async function fetchCalendarData() {
  const res = await fetch("data/calendar.json");
  return res.json();
}

function getDateRange(start, end) {
  const range = [];
  const d = new Date(start);
  while (d <= new Date(end)) {
    range.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return range;
}

function renderCalendar(data) {
  const container = document.getElementById("calendar-container");
  const start = new Date("2025-07-01");
  const end = new Date("2025-09-07");
  const allDays = getDateRange(start, end);

  let html = "<table><thead><tr><th>週次</th><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead><tbody>";

  for (let i = 0; i < allDays.length; i += 7) {
    html += "<tr><td>第" + (i / 7 + 1) + "週</td>";
    for (let j = 0; j < 7; j++) {
      const day = allDays[i + j];
      if (!day) {
        html += "<td></td>";
        continue;
      }
      const iso = day.toISOString().split("T")[0];
      const lessons = (data[iso] || []).map(d => `<div>${d.user}: ${d.subject}</div>`).join("");
      html += `<td><div class="date">${iso.slice(5)}</div>${lessons}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table>";
  container.innerHTML = html;
}

(async () => {
  const calendarData = await fetchCalendarData();
  renderCalendar(calendarData);
})();
