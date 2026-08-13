"use client";

import { useEffect, useRef, useState } from "react";
import { LEAD_COLUMN_DEFS, saveVisibleLeadColumns } from "@/lib/leadColumns";

export default function ColumnSettingsPanel({
  visible,
  onChange,
}: {
  visible: string[];
  onChange: (cols: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function toggle(key: string, checked: boolean) {
    const next = checked ? [...visible, key] : visible.filter((k) => k !== key);
    saveVisibleLeadColumns(next);
    onChange(next);
  }

  return (
    <div className="col-settings" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-ghost col-settings-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⚙<span className="chevron">▾</span>
      </button>
      {open && (
        <div className="col-settings-panel">
          {LEAD_COLUMN_DEFS.map((c) => (
            <label key={c.key} className={`col-check-item${c.locked ? " locked" : ""}`}>
              <input
                type="checkbox"
                checked={visible.includes(c.key)}
                disabled={c.locked}
                onChange={(e) => toggle(c.key, e.target.checked)}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
