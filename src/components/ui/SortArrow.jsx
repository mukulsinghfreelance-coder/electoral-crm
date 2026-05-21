// ─── src/components/ui/SortArrow.jsx ─────────────────────────────────────────
export function SortArrow({ col, sort, onClick }) {
  const active = sort.col === col
  return (
    <span
      onClick={() => onClick(col)}
      style={{ cursor: 'pointer', marginLeft: 3, color: active ? '#185FA5' : 'var(--color-text-tertiary)', fontSize: 10, userSelect: 'none' }}
    >
      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}
