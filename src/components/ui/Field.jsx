// ─── src/components/ui/Field.jsx ─────────────────────────────────────────────
export function Field({ label, required, error, children, style = {} }) {
  return (
    <div style={{ marginBottom: 9, ...style }}>
      <label style={{ display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-tertiary)', marginBottom: 3 }}>
        {label}{required && <span style={{ color: '#E24B4A', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 9, color: '#A32D2D', marginTop: 2 }}>{error}</div>}
    </div>
  )
}