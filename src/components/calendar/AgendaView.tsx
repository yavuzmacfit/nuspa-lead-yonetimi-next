import { addDays, dateKey, EnrichedTask, statusClass } from "@/lib/calendarUtils";
import { fmtDate, TASK_STATUS_LABEL } from "@/lib/format";

function TaskRow({ t }: { t: EnrichedTask }) {
  return (
    <tr>
      <td style={{ width: 70, color: "var(--muted)", fontWeight: 600 }}>
        {t.dueAt ? new Date(t.dueAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—"}
      </td>
      <td>
        <span className={`status-dot dot-${statusClass(t)}`}></span>
        <b>
          {t.memberName} {t.memberSurname}
        </b>
      </td>
      <td style={{ color: "var(--muted)" }}>{t.type}</td>
      <td style={{ color: "var(--muted)" }}>{t.assignedToName || "—"}</td>
      <td>
        <span className={`status-label ${statusClass(t)}`}>{TASK_STATUS_LABEL[t.effectiveStatus] || t.effectiveStatus}</span>
      </td>
    </tr>
  );
}

export default function AgendaView({ tasks, monday }: { tasks: EnrichedTask[]; monday: Date }) {
  const sunday = addDays(monday, 6);
  const inRange = tasks.filter((t) => {
    if (!t.dueAt) return false;
    const k = t.dueAt.slice(0, 10);
    return k >= dateKey(monday) && k <= dateKey(sunday);
  });
  const undated = tasks.filter((t) => !t.dueAt);

  if (inRange.length === 0 && undated.length === 0) {
    return <div className="empty-state">Bu haftada görüntülenecek görev yok.</div>;
  }

  const byDay: Record<string, EnrichedTask[]> = {};
  inRange.forEach((t) => {
    const key = t.dueAt!.slice(0, 10);
    (byDay[key] = byDay[key] || []).push(t);
  });
  const days = Object.keys(byDay).sort();

  return (
    <>
      {days.map((day) => (
        <div className="agenda-day" key={day}>
          <div className="agenda-day-header">
            <span>{new Date(day).toLocaleDateString("tr-TR", { weekday: "long" })}</span>
            <span>{fmtDate(day)}</span>
          </div>
          <table className="agenda-table">
            <tbody>
              {byDay[day]
                .sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""))
                .map((t) => (
                  <TaskRow t={t} key={t.id} />
                ))}
            </tbody>
          </table>
        </div>
      ))}
      {undated.length > 0 && (
        <div className="agenda-day">
          <div className="agenda-day-header">
            <span>Tarihsiz</span>
          </div>
          <table className="agenda-table">
            <tbody>
              {undated.map((t) => (
                <TaskRow t={t} key={t.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
