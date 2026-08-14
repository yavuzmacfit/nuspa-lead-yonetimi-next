"use client";

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.5 2.5.8 3.8.9.6 0 1 .5 1 1.1V21c0 .6-.4 1-1 1C10.5 22 2 13.5 2 3.9c0-.6.4-1 1-1h3.9c.6 0 1 .4 1.1 1 .1 1.3.4 2.6.9 3.8.2.3.1.7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 3h2l.4 2M6 15h11l3-8H5.4M6 15L4.4 5M6 15l-1.2 3H18M9 20a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 9 20zM17 20a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 17 20z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GenericTaskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

const TASK_TYPE_STYLE: Record<string, { icon: React.ReactNode; className: string }> = {
  TELEFON_ARAMASI: { icon: <PhoneIcon />, className: "task-icon-blue" },
  SATIS: { icon: <CartIcon />, className: "task-icon-teal" },
};

export default function TaskTypeIconButton({ taskType, title }: { taskType: string; title?: string }) {
  const style = TASK_TYPE_STYLE[taskType] ?? { icon: <GenericTaskIcon />, className: "task-icon-muted" };
  return (
    <span className={`task-icon-indicator ${style.className}`} title={title ?? taskType}>
      {style.icon}
    </span>
  );
}
