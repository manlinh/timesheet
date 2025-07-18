// 匯出日程表為 Excel 檔
function exportSchedule() {
  const user = localStorage.getItem("currentUser");
  fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${SCHEDULE_PATH}`)
    .then(res => res.json())
    .then(data => {
      const schedule = data[user] || [];
      const weeks = Array.from({ length: Math.ceil(schedule.length / 7) }, (_, i) => i + 1);
      const rows = weeks.map((w, i) => {
        const row = { 週數: `第 ${w} 週` };
        ["一", "二", "三", "四", "五", "六", "日"].forEach((d, j) => {
          row["星期" + d] = schedule[i * 7 + j] || "";
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "個人日程");
      XLSX.writeFile(wb, `${user}_日程.xlsx`);
    });
}
