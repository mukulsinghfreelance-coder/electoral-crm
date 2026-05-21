import React from 'react'
import { TAG_STYLE } from '../../constants/data'
import { Badge } from '../ui/Badge'
import { Btn } from '../ui/Btn'

export default function ContactDetail({ contact, onEdit, onDelete }) {
  if (!contact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6, color: 'var(--color-text-tertiary)', padding: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 28 }}>🔍</span>
        <span style={{ fontSize: 11 }}>Select a contact to view details</span>
      </div>
    )
  }

  const c = contact
  const s = TAG_STYLE[c.tag] || { bg: '#F1EFE8', cl: '#444441' }
  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '11px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.bg, color: s.cl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
          <div style={{ marginTop: 4 }}><Badge tag={c.tag} /></div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        {[
          ['Phone',     c.phone],
          ['WhatsApp',  c.wa],
          ['Caste',     c.caste],
          ['Village',   c.village],
          ['Mandal',    c.mandal],
          ['Panchayat', c.panchayat],
          ['Booth No.', c.bno],
          ['Booth Name',c.bnm],
          ['Notes',     c.notes],
        ].map(([label, value]) => value ? (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12 }}>{value}</div>
          </div>
        ) : null)}
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 5 }}>
        <Btn style={{ flex: 1, justifyContent: 'center' }} onClick={() => onEdit(c)}>✏️ Edit</Btn>
        <Btn variant="danger" onClick={() => onDelete(c.id)}>🗑️</Btn>
      </div>
    </>
  )
}
