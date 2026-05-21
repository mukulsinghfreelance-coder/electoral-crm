import React from 'react'
import { RATING_STYLE } from '../../constants/data'
import { Btn } from '../ui/Btn'

export default function BoothDetail({ booth, settings, onEdit, onDelete }) {
  if (!booth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6, color: 'var(--color-text-tertiary)', padding: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 28 }}>📍</span>
        <span style={{ fontSize: 11 }}>Select a booth to view details</span>
      </div>
    )
  }

  const b = booth
  const rs = RATING_STYLE[b.rating] || { bg: '#F1EFE8', cl: '#444441' }

  return (
    <>
      {/* Header */}
      <div style={{ padding: '11px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: rs.bg, color: rs.cl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
          {b.rating || '?'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Booth {b.bno}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{b.bnm || '—'}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px', flex: 1, overflowY: 'auto' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
          {[['Mandal', b.mandal], ['Panchayat', b.panchayat], ['Voters', b.voters || '—'], ['Rating', b.rating || '—']].map(([l, v]) => (
            <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: 6, padding: '5px 7px' }}>
              <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Top castes */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Top Castes</div>
          <div style={{ fontSize: 12 }}>{b.castes.filter(Boolean).join(', ') || '—'}</div>
        </div>

        {/* Election history */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Election history</div>
          {b.elec.map((e, ei) => {
            const total = (e.votes || []).reduce((a, v) => a + (v || 0), 0)
            const rem = (e.cast || 0) - total
            return (
              <div key={ei} style={{ fontSize: 10, padding: '4px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ fontWeight: 500, marginBottom: 2, color: 'var(--color-text-secondary)' }}>
                  {settings.elections[ei] || `E${ei + 1}`}
                </div>
                <div>
                  Cast:<b>{e.cast || 0}</b>{' '}
                  {settings.parties.map((p, pi) => `${p}:${e.votes?.[pi] || 0}`).join(' ')}{' '}
                  Rem:<b style={{ color: rem < 0 ? '#A32D2D' : 'inherit' }}>{rem >= 0 ? rem : '—'}</b>
                </div>
              </div>
            )
          })}
        </div>

        {/* Notes */}
        {b.notes && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Notes</div>
            <div style={{ fontSize: 12 }}>{b.notes}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 5 }}>
        <Btn style={{ flex: 1, justifyContent: 'center' }} onClick={() => onEdit(b)}>✏️ Edit</Btn>
        <Btn variant="danger" onClick={() => onDelete(b.id)}>🗑️</Btn>
      </div>
    </>
  )
}
