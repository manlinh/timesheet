function exportSchedule() {
  const user = localStorage.getItem("currentUser");
  fetch(`https://raw.githubusercontent.com/manlinh/timesheet/main/data/schedule.json`)
    .then(res => res.json())
    .then(data => {
      const schedule = data[user] || [];
      const rows = [];
      for (let i = 0; i < schedule.length; i += 7) {
        const row = { 週次: `第${Math.floor(i / 7) + 1}週` };
        ["一", "二", "三", "四", "五", "六", "日"].forEach((d, j) => {
          row["星期" + d] = schedule[i + j] || "";
        });
        rows.push(row);
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "日程");
      XLSX.writeFile(wb, `${user}_日程.xlsx`);
    });
}