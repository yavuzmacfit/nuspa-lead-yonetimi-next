"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowActionMenuItem {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function RowActionMenu({ items }: { items: RowActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, left: rect.right - 220 });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="row-menu-btn"
        title="Diğer işlemler"
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openMenu();
        }}
      >
        ⋮
      </button>
      {open &&
        createPortal(
          <div className="row-menu-panel" ref={menuRef} style={{ top: pos.top, left: pos.left }}>
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                className="row-menu-item"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <span className="row-menu-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
