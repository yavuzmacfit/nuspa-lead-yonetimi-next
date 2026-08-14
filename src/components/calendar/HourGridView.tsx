"use client";

import { useEffect, useState } from "react";
import {
  addDays,
  CAL_HOUR_END,
  CAL_HOUR_START,
  CAL_ROW_H,
  dateKey,
  EnrichedTask,
  eventToneClass,
  layoutDayEvents,
  mondayOf,
} from "@/lib/calendarUtils";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function HourGridView({
  tasks,
  refDate,
  colsCount,
}: {
  tasks: EnrichedTask[];
  refDate: Date;
  colsCount: number;
}) {
  const startDay = colsCount === 1 ? refDate : mondayOf(refDate);
  const todayKey = dateKey(new Date());

  const byDate: Record<string, EnrichedTask[]> = {};
  tasks.forEach((t) => {
    if (!t.dueAt) return;
    const key = t.dueAt.slice(0, 10);
    (byDate[key] = byDate[key] || []).push(t);
  });

  const hourCount = CAL_HOUR_END - CAL_HOUR_START + 1;
  const hourLabels = Array.from({ length: hourCount }, (_, i) => String(CAL_HOUR_START + i).padStart(2, "0"));
  const days = Array.from({ length: colsCount }, (_, i) => addDays(startDay, i));
  // grid-body içindeki flex stretch, max-height ile kısıtlanan görünür alana göre
  // hesaplanıp gün sütunlarını kırpabiliyor; asıl içerik yüksekliğini elle veriyoruz.
  const gridHeight = hourCount * CAL_ROW_H;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const nowKey = dateKey(now);
  const nowTop = (now.getHours() + now.getMinutes() / 60 - CAL_HOUR_START) * CAL_ROW_H;
  const showNowLine = now.getHours() >= CAL_HOUR_START && now.getHours() <= CAL_HOUR_END;

  return (
    <div className="grid-wrap">
      <div className="grid-header">
        <div className="axis-spacer"></div>
        {days.map((d, i) => {
          const isToday = dateKey(d) === todayKey;
          return (
            <div className={`day-col-header${isToday ? " today" : ""}`} key={i}>
              {colsCount === 1 ? (
                d.toLocaleDateString("tr-TR", { weekday: "long" })
              ) : (
                <>
                  <span className="dow">{DAY_NAMES[i]}</span>
                  <span className="ddate">
                    {d.getDate()}/{d.getMonth() + 1}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid-body">
        <div className="hour-axis" style={{ height: gridHeight }}>
          {hourLabels.map((h) => (
            <div className="hour-label" key={h}>
              <span className="hour-label-text">{h}</span>
            </div>
          ))}
        </div>
        <div className="day-columns" style={{ height: gridHeight }}>
          {days.map((d, i) => {
            const isToday = dateKey(d) === todayKey;
            const dayTasks = byDate[dateKey(d)] || [];
            const tops = dayTasks.map((t) => {
              const dt = new Date(t.dueAt as string);
              const hourFrac = Math.max(CAL_HOUR_START, Math.min(CAL_HOUR_END, dt.getHours() + dt.getMinutes() / 60));
              return (hourFrac - CAL_HOUR_START) * CAL_ROW_H;
            });
            const layout = layoutDayEvents(tops.map((top) => ({ top })));
            return (
              <div className={`day-col${isToday ? " today" : ""}`} key={i}>
                {dayTasks.map((t, idx) => {
                  const dt = new Date(t.dueAt as string);
                  const top = tops[idx];
                  const { col, totalCols } = layout[idx];
                  const style: { top: number; zIndex: number; left?: string; width?: string } = {
                    top,
                    zIndex: col + 1,
                  };
                  if (totalCols > 1) {
                    style.left = `calc(4px + (100% - 8px) * ${col} / ${totalCols})`;
                    style.width = `calc((100% - 8px) / ${totalCols} - 4px)`;
                  }
                  return (
                    <div
                      className={`event-block ${eventToneClass(t)}${totalCols > 1 ? " overlap" : ""}`}
                      style={style}
                      title={t.type}
                      key={t.id}
                    >
                      <b>
                        {t.memberName} {t.memberSurname}
                      </b>
                      <small>
                        {dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {t.type}
                        {t.assignedToName ? " · " + t.assignedToName : ""}
                      </small>
                    </div>
                  );
                })}
                {isToday && dateKey(d) === nowKey && showNowLine && (
                  <div className="now-line" style={{ top: nowTop }}>
                    <div className="now-arrow"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
