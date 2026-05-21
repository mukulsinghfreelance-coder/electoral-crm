import React from 'react'
import { Badge } from '../ui/Badge'
import { Btn } from '../ui/Btn'
import { SortArrow } from '../ui/SortArrow'

const COLUMNS = [
  ['name',      'Name',      108],
  ['phone',     'Phone',      86],
  ['caste',     'Caste',      62],
  ['mandal',    'Mandal',     70],
  ['panchayat', 'Panchayat',  73],
  ['bno',       'Booth',      38],
  ['tag',       'Tag',        82],
]

export default function ContactTable({
  slice, selContact, sort, onSort, onSelect,
  filteredCount, page, pages, onPrevPage, onNextPage,
  search, onSearch,
  fMandal, fPanch, fBooth, fCaste, fTag, activeTag,
  onFMandal, onFPanch, onFBooth, onFCaste, onFTag,
  settings, contacts,
  onAdd, onExport, onImport,
}) {
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

  const mandalPanchs = fMandal
    ? settings.mandals.find(m => m.name === fMandal)?.panchayats || []
    : [...new Set(settings.mandals.flatMap(m => m.panchayats))].sort()

  const boothOptions = [...new Set(contacts.map(c => c.bno).filter(Boolean))].sort((a, b) => +a - +b)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{activeTag || 'All contacts'}</span>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search name, phone, caste, booth…"
          style={{ flex: 1, padding: '5px 8px', fontSize: 12, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', outline: 'none' }}
        />
        <Btn variant="prim" onClick={onAdd}>+ Add</Btn>
        <Btn onClick={onExport} title="Export CSV">⬇️</Btn>
        <Btn onClick={onImport} title="Import CSV (Admin)">⬆️</Btn>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '8px 11px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        {[
          ['Contacts',    contacts.length,                    'total'],
          ['Karyakartas', contacts.filter(c => c.tag === 'Karyakarta').length, 'workers'],
          ['Key Voters',  contacts.filter(c => c.tag === 'Key Voter').length,  'priority'],
          ['Opponents',   contacts.filter(c => c.tag === 'Opponent').length,   'monitor'],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: 'var(--color-background-secondary)', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>{v}</div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0, flexWrap: 'wrap' }}>
        {[
          [fMandal, onFMandal, 'All Mandals',    settings.mandals.map(m => m.name)],
          [fPanch,  onFPanch,  'All Panchayats', mandalPanchs],
          [fBooth,  onFBooth,  'All Booths',      boothOptions],
          [fCaste,  onFCaste,  'All Castes',      settings.castes],
          [fTag,    onFTag,    'All Tags',         ['Key Voter','Karyakarta','Supporter','Opponent','Champion','Partner','Padadhikari','Neutral']],
        ].map(([val, setter, placeholder, opts], i) => (
          <select
            key={i}
            value={val}
            onChange={e => setter(e.target.value)}
            style={{ padding: '4px 6px', fontSize: 11, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}
          >
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-tertiary)' }}>{filteredCount} results</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {COLUMNS.map(([col, label, w]) => (
                <th key={col} style={{ ...thS, width: w }}>
                  {label}<SortArrow col={col} sort={sort} onClick={onSort} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map(c => (
              <tr
                key={c.id}
                onClick={() => onSelect(c)}
                style={{ background: selContact?.id === c.id ? '#E6F1FB' : 'transparent', cursor: 'pointer' }}
              >
                <td style={{ ...tdS, fontWeight: 500 }}>{c.name}</td>
                <td style={{ ...tdS, color: 'var(--color-text-secondary)' }}>{c.phone}</td>
                <td style={tdS}>{c.caste}</td>
                <td style={tdS}>{c.mandal}</td>
                <td style={tdS}>{c.panchayat}</td>
                <td style={{ ...tdS, textAlign: 'center', color: 'var(--color-text-secondary)' }}>{c.bno}</td>
                <td style={tdS}><Badge tag={c.tag} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {slice.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>👥</span><span>No contacts match</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ padding: '5px 11px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
        <span>{filteredCount} contacts — page {page} of {pages}</span>
        <span style={{ flex: 1 }} />
        <Btn onClick={onPrevPage} disabled={page <= 1}>◀</Btn>
        <Btn onClick={onNextPage} disabled={page >= pages}>▶</Btn>
      </div>
    </div>
  )
}
