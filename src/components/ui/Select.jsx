// ─── src/components/ui/Select.jsx ────────────────────────────────────────────
export function Select({ error, children, style = {}, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%', padding: '5px 8px', fontSize: 12,
        border: `0.5px solid ${error ? '#E24B4A' : 'var(--color-border-secondary)'}`,
        borderRadius: 6,
        background: 'var(--color-background-secondary)',
        color: 'var(--color-text-primary)',
        ...style
      }}
    >
      {children}
    </select>
  )
}
