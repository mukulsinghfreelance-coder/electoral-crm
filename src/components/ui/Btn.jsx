// ─── src/components/ui/Btn.jsx ───────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'default', style = {}, disabled = false, title = '' }) {
  const variants = {
    default: { borderColor: 'var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)' },
    prim:    { borderColor: '#185FA5', background: '#185FA5', color: '#fff' },
    danger:  { borderColor: '#F7C1C1', background: 'transparent', color: '#A32D2D' },
  }
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 9px', fontSize: 11, border: '0.5px solid',
        borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        ...variants[variant], ...style
      }}
    >
      {children}
    </button>
  )
}
