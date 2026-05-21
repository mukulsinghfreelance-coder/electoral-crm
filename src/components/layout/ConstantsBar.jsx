import React from 'react'

export default function ConstantsBar({ settings, syncStatus, onEdit, onPull }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#042C53', color: '#B5D4F4',
      borderBottom: '0.5px solid #185FA5', flexShrink: 0,
    }}>
      {[
        ['State',        settings.state],
        ['Lok Sabha',    settings.ls],
        ['Vidhan Sabha', settings.vs],
        ['Total Voters', settings.totalVoters || '—'],
        ['Total Booths', settings.totalBooths || '—'],
      ].map(([l, v]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRight: '0.5px solid #185FA5', fontSize: 11 }}>
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: '#85B7EB' }}>{l}</span>
          <span style={{ fontWeight: 500, color: '#fff', fontSize: 11, marginLeft: 2 }}>{v}</span>
        </div>
      ))}

      {syncStatus && (
        <span style={{ marginLeft: 8, fontSize: 10, color: syncStatus === 'ok' ? '#7EE8A2' : syncStatus === 'error' ? '#F9A8A8' : '#B5D4F4' }}>
          {syncStatus === 'syncing' ? '⏳ Syncing…' : syncStatus === 'ok' ? '✅ Synced' : '❌ Sync failed'}
        </span>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, paddingRight: 8 }}>
        {settings.sheetsUrl && (
          <button onClick={onPull} style={{ padding: '4px 8px', fontSize: 10, background: 'transparent', border: '0.5px solid #185FA5', borderRadius: 5, color: '#B5D4F4', cursor: 'pointer', fontFamily: 'inherit' }}>
            ⬇️ Pull Sheets
          </button>
        )}
        <button onClick={onEdit} style={{ padding: '4px 9px', fontSize: 10, background: 'transparent', border: '0.5px solid #185FA5', borderRadius: 5, color: '#B5D4F4', cursor: 'pointer', fontFamily: 'inherit' }}>
          ✏️ Edit
        </button>
      </div>
    </div>
  )
}
