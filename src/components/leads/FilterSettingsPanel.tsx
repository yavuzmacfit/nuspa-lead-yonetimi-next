"use client";

import { useEffect, useRef, useState } from "react";
import { LEAD_FILTER_DEFS, saveVisibleLeadFilters } from "@/lib/leadFilters";

export default function FilterSettingsPanel({
  visible,
  onChange,
}: {
  visible: string[];
  onChange: (keys: string[]) => void;
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
    saveVisibleLeadFilters(next);
    onChange(next);
  }

  return (
    <div className="filter-settings" ref={wrapRef}>
      <button
        type="button"
        className="filter-settings-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2h14l-5.5 6.5V14l-3 1.5V8.5L1 2z" fill="currentColor" />
        </svg>
        <span className="chevron">▾</span>
      </button>
      {open && (
        <div className="filter-settings-panel">
          {LEAD_FILTER_DEFS.map((f) => (
            <label key={f.key} className="col-check-item">
              <input type="checkbox" checked={visible.includes(f.key)} onChange={(e) => toggle(f.key, e.target.checked)} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
