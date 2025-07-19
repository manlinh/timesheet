function exportToExcel() {
  const data = [["教師", ...Array.from({length:14},(_,i)=>`W${Math.floor(i/7)+1}D${i%7+1}`)]];
  for (const u in currentSchedule) data.push([u, ...currentSchedule[u]]);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");
  XLSX.writeFile(wb, "timesheet.xlsx");
}
