import { dateKey, EnrichedTask, statusClass } from "@/lib/calendarUtils";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function MonthView({ tasks, refDate }: { tasks: EnrichedTask[]; refDate: Date }) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Pazartesi=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const byDate: Record<string, EnrichedTask[]> = {};
  tasks.forEach((t) => {
    if (!t.dueAt) return;
    const key = t.dueAt.slice(0, 10);
    (byDate[key] = byDate[key] || []).push(t);
  });

  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(
      <div className="day-cell other-month" key={`prev-${i}`}>
        <div className="day-num">{prevMonthDays - startOffset + i + 1}</div>
      </div>
    );
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTasks = (byDate[key] || []).sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""));
    const isToday = key === todayKey;
    cells.push(
      <div className={`day-cell${isToday ? " today" : ""}`} key={key}>
        <div className="day-num">{d}</div>
        {dayTasks.slice(0, 3).map((t) => (
          <div className={`event-pill ${statusClass(t)}`} key={t.id}>
            <span className={`dot dot-${statusClass(t)}`}></span>
            {t.memberSurname}
          </div>
        ))}
        {dayTasks.length > 3 && <div className="more-link">+{dayTasks.length - 3} daha</div>}
      </div>
    );
  }
  const totalCells = startOffset + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cells.push(
      <div className="day-cell other-month" key={`next-${i}`}>
        <div className="day-num">{i}</div>
      </div>
    );
  }

  return (
    <div className="month-grid">
      <div className="weekday-row">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="weeks">{cells}</div>
    </div>
  );
}
