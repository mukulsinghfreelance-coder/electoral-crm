import React from 'react'
import { TAGS, TAG_STYLE } from '../../constants/data'

function SBItem({ icon, label, count, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 8px', margin: '1px 4px', borderRadius: 6,
        cursor: 'pointer', fontSize: 12,
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        background: active ? 'var(--color-background-primary)' : 'transparent',
        fontWeight: active ? 500 : 400,
      }}
    >
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{
          fontSize: 9,
          color: active ? '#185FA5' : 'var(--color-text-tertiary)',
          background: active ? '#E6F1FB' : 'var(--color-background-tertiary)',
          borderRadius: 100, padding: '1px 5px',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

function SBSection({ label }) {
  return (
    <div style={{ padding: '7px 8px 1px', fontSize: 9, fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {label}
    </div>
  )
}

export default function Sidebar({
  screen, activeTag, contacts, booths, settings, tagCounts,
  onNavContacts, onNavMandal, onNavPanchayat,
  onFilterTag, onNavBooths, onOpenSettings, onOpenSheets,
}) {
  return (
    <div style={{
      width: 196, minWidth: 196,
      borderRight: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-secondary)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '10px 10px 8px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>📋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>ContactBook</div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Electoral Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <SBSection label="Contacts" />
      <SBItem icon="👥" label="All Contacts" count={contacts.length} active={screen === 'contacts' && !activeTag} onClick={onNavContacts} />
      <SBItem icon="🗺️" label="By Mandal"    active={false} onClick={onNavMandal} />
      <SBItem icon="🏘️" label="By Panchayat" active={false} onClick={onNavPanchayat} />

      {/* Tags */}
      <SBSection label="By Tag" />
      {TAGS.map((tag, i) => (
        <SBItem
          key={tag}
          icon={<span style={{ width: 6, height: 6, borderRadius: '50%', background: Object.values(TAG_STYLE)[i]?.cl, display: 'inline-block' }} />}
          label={tag}
          count={tagCounts[tag] || 0}
          active={activeTag === tag}
          onClick={() => onFilterTag(tag)}
        />
      ))}

      {/* Modules */}
      <SBSection label="Modules" />
      <SBItem icon="📍" label="Booth Management" count={booths.length} active={screen === 'booths'} onClick={onNavBooths} />
      <SBItem icon="🔗" label="Google Sheets"    active={false} onClick={onOpenSheets} />
      <SBItem icon="⚙️" label="Settings"         active={false} onClick={onOpenSettings} />

      {/* Stats */}
      <div style={{ padding: '7px 7px', borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {[
          ['Contacts',  contacts.length],
          ['Mandals',   settings.mandals.length],
          ['Booths',    booths.length],
          ['Castes',    settings.castes.length],
        ].map(([l, v]) => (
          <div key={l} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '6px 7px' }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
