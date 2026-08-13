export default function ToggleIcon({ active }: { active: boolean | number }) {
  return <span className={`icon-${active ? "yes" : "no"}`}>{active ? "✓" : "⊗"}</span>;
}
