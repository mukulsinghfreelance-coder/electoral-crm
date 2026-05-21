import React from 'react'
import { RatingBadge } from '../ui/Badge'
import { Btn } from '../ui/Btn'

export default function BoothTable({ filteredBooths, booths, selBooth, onSelect, onAdd, settings, boothSearch, onSearch, bfRating, onBfRating, bfPanch, onBfPanch, allPanchs }) {
  const thS = {
    position: 'sticky', top: 0,
    background: 'var(--color-background-secondary)',
    fontSize: 9, fontWeight: 500,
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    padding: '6px 8px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
    textAlign: 'left', userSelect: 'none',
  }
  const tdS = {
    padding: '7px 8px', fontSize: 12,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
  }

  const ratingCounts = { A: 0, B: 0, C: 0 }
  booths.forEach(b => { if (b.rating) ratingCounts[b.rating]++ })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Booth Management</span>
        <input
          value={boothSearch}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search booths…"
          style={{ flex: 1, padding: '5px 8px', fontSize: 12, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', outline: 'none' }}
        />
        <select value={bfRating} onChange={e => onBfRating(e.target.value)} style={{ padding: '4px 6px', fontSize: 11, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}>
          <option value="">All Ratings</option>
          <option>A</option><option>B</option><option>C</option>
        </select>
        <select value={bfPanch} onChange={e => onBfPanch(e.target.value)} style={{ padding: '4px 6px', fontSize: 11, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}>
          <option value="">All Panchayats</option>
          {allPanchs.map(p => <option key={p}>{p}</option>)}
        </select>
        <Btn variant="prim" onClick={onAdd}>+ Add</Btn>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '8px 11px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        {[
          ['Total Booths', booths.length,       ''],
          ['Rating A',     ratingCounts.A, '#27500A'],
          ['Rating B',     ratingCounts.B, '#633806'],
          ['Rating C',     ratingCounts.C, '#791F1F'],
        ].map(([l, v, cl]) => (
          <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1, color: cl || 'inherit' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[['No.',44],['Booth Name',108],['Mandal',76],['Panchayat',76],['Voters',52],['Rating',44],['Top Castes',96],['Last Election',90]].map(([l, w]) => (
                <th key={l} style={{ ...thS, width: w }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBooths.map(b => {
              const last = b.elec[2] || { votes: [] }
              return (
                <tr
                  key={b.id}
                  onClick={() => onSelect(b)}
                  style={{ background: selBooth?.id === b.id ? '#E6F1FB' : 'transparent', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border-tertiary)' }}
                >
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 500 }}>{b.bno}</td>
                  <td style={{ ...tdS, fontWeight: 500 }}>{b.bnm || '—'}</td>
                  <td style={{ ...tdS, color: 'var(--color-text-secondary)' }}>{b.mandal}</td>
                  <td style={{ ...tdS, color: 'var(--color-text-secondary)' }}>{b.panchayat}</td>
                  <td style={{ ...tdS, color: 'var(--color-text-secondary)' }}>{b.voters || '—'}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{b.rating ? <RatingBadge r={b.rating} /> : '—'}</td>
                  <td style={{ ...tdS, fontSize: 10, color: 'var(--color-text-secondary)' }}>{b.castes.filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ ...tdS, fontSize: 10, color: 'var(--color-text-secondary)' }}>{settings.parties.map((p, i) => `${p}:${last.votes?.[i] || 0}`).join(' / ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredBooths.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>📍</span><span>No booths found</span>
          </div>
        )}
      </div>
    </div>
  )
}
