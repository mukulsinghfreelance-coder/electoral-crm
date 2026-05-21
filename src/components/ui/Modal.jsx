// ─── src/components/ui/Modal.jsx ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, padding: '40px 16px', overflowY: 'auto'
      }}
    >
      <div style={{
        background: 'var(--color-background-primary)', borderRadius: 10,
        border: '0.5px solid var(--color-border-tertiary)',
        padding: '16px 18px', width: wide ? 620 : 420,
        maxHeight: '90vh', overflowY: 'auto', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
