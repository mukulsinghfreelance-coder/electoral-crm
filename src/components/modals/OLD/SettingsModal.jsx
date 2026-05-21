// ─── SettingsModal.jsx ────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

export function SettingsModal({ open, onClose, settings, setSettings }) {
  const [s, setS] = React.useState(settings)
  const [newMandal, setNewMandal] = React.useState('')
  const [selMandal, setSelMandal] = React.useState(0)
  const [newPanch, setNewPanch] = React.useState('')
  const [newCaste, setNewCaste] = React.useState('')
  const [newParty, setNewParty] = React.useState('')
  const [elections, setElections] = React.useState([...settings.elections])
  const [newPin, setNewPin] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('geo')

  React.useEffect(() => { if (open) { setS({ ...settings }); setElections([...settings.elections]); setSelMandal(0) } }, [open])

  const save = () => { setSettings({ ...s, elections }); onClose() }

  const addMandal = () => {
    const n = newMandal.trim()
    if (!n || s.mandals.find(m => m.name === n)) return
    setS(p => ({ ...p, mandals: [...p.mandals, { name: n, panchayats: [] }] }))
    setNewMandal(''); setSelMandal(s.mandals.length)
  }
  const removeMandal = i => { const m = [...s.mandals]; m.splice(i, 1); setS(p => ({ ...p, mandals: m })); setSelMandal(0) }
  const addPanch = () => {
    const n = newPanch.trim(); if (!n || !s.mandals[selMandal]) return
    const m = [...s.mandals]
    if (!m[selMandal].panchayats.includes(n)) m[selMandal] = { ...m[selMandal], panchayats: [...m[selMandal].panchayats, n] }
    setS(p => ({ ...p, mandals: m })); setNewPanch('')
  }
  const removePanch = (mi, pi) => {
    const m = [...s.mandals]; m[mi] = { ...m[mi], panchayats: m[mi].panchayats.filter((_, i) => i !== pi) }
    setS(p => ({ ...p, mandals: m }))
  }

  const tabSty = k => ({
    border: 'none', padding: '6px 10px', fontSize: 11, cursor: 'pointer',
    borderRadius: '6px 6px 0 0', fontFamily: 'inherit',
    background: activeTab === k ? 'var(--color-background-primary)' : 'transparent',
    color: activeTab === k ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
    fontWeight: activeTab === k ? 500 : 400,
  })

  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings (Admin)" wide>
      <div style={{ display: 'flex', gap: 3, marginBottom: 12, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {[['geo','🗺️ Geography'],['castes','🫂 Castes'],['parties','🏛️ Parties'],['admin','🔐 Admin']].map(([k, v]) => (
          <button key={k} style={tabSty(k)} onClick={() => setActiveTab(k)}>{v}</button>
        ))}
      </div>

      {activeTab === 'geo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 7 }}>Mandals</div>
            <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, overflow: 'hidden', maxHeight: 180, overflowY: 'auto', marginBottom: 7 }}>
              {s.mandals.map((m, i) => (
                <div key={i} onClick={() => setSelMandal(i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', fontSize: 11, background: selMandal === i ? '#E6F1FB' : 'transparent', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <span style={{ fontWeight: selMandal === i ? 500 : 400, color: selMandal === i ? '#185FA5' : 'inherit' }}>{m.name}</span>
                  <button onClick={e => { e.stopPropagation(); removeMandal(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: 11 }}>✕</button>
                </div>
              ))}
              {s.mandals.length === 0 && <div style={{ padding: 8, color: 'var(--color-text-tertiary)', fontSize: 11 }}>No mandals</div>}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <Input value={newMandal} onChange={e => setNewMandal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMandal()} placeholder="New mandal…" style={{ fontSize: 11 }} />
              <Btn variant="prim" onClick={addMandal}>+</Btn>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 7 }}>Panchayats under <span style={{ color: '#185FA5' }}>{s.mandals[selMandal]?.name || '—'}</span></div>
            <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, overflow: 'hidden', maxHeight: 180, overflowY: 'auto', marginBottom: 7 }}>
              {(s.mandals[selMandal]?.panchayats || []).map((p, pi) => (
                <div key={pi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', fontSize: 11, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  {p}
                  <button onClick={() => removePanch(selMandal, pi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: 11 }}>✕</button>
                </div>
              ))}
              {(s.mandals[selMandal]?.panchayats || []).length === 0 && <div style={{ padding: 8, color: 'var(--color-text-tertiary)', fontSize: 11 }}>No panchayats</div>}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <Input value={newPanch} onChange={e => setNewPanch(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPanch()} placeholder="New panchayat…" style={{ fontSize: 11 }} />
              <Btn variant="prim" onClick={addPanch}>+</Btn>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'castes' && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 7 }}>Caste list</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
            {s.castes.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 100, fontSize: 11 }}>
                {c}
                <button onClick={() => setS(p => ({ ...p, castes: p.castes.filter(x => x !== c) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: 10 }}>✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <Input value={newCaste} onChange={e => setNewCaste(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCaste.trim() && !s.castes.includes(newCaste.trim())) { setS(p => ({ ...p, castes: [...p.castes, newCaste.trim()] })); setNewCaste('') } }} placeholder="Add caste…" style={{ fontSize: 11 }} />
            <Btn variant="prim" onClick={() => { const n = newCaste.trim(); if (n && !s.castes.includes(n)) { setS(p => ({ ...p, castes: [...p.castes, n] })); setNewCaste('') } }}>+ Add</Btn>
          </div>
        </div>
      )}

      {activeTab === 'parties' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 7 }}>Party alliances (max 3)</div>
            {s.parties.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Input value={p} onChange={e => { const ps = [...s.parties]; ps[i] = e.target.value; setS(prev => ({ ...prev, parties: ps })) }} style={{ fontSize: 11 }} />
                <button onClick={() => setS(prev => ({ ...prev, parties: prev.parties.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D' }}>✕</button>
              </div>
            ))}
            {s.parties.length < 3 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                <Input value={newParty} onChange={e => setNewParty(e.target.value)} placeholder="Add party…" style={{ fontSize: 11 }} />
                <Btn variant="prim" onClick={() => { const n = newParty.trim(); if (n && s.parties.length < 3) { setS(p => ({ ...p, parties: [...p.parties, n] })); setNewParty('') } }}>+</Btn>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 7 }}>Election names (oldest → latest)</div>
            {elections.map((e, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>E{i + 1} {i === 0 ? '(oldest)' : i === 2 ? '(latest)' : ''}</div>
                <Input value={e} onChange={ev => { const el = [...elections]; el[i] = ev.target.value; setElections(el) }} style={{ fontSize: 11 }} placeholder={`Election ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div>
          <div style={{ background: '#FAEEDA', border: '0.5px solid #E6C68A', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 11, color: '#633806' }}>
            ⚠️ PIN-based simulation. Integrate with SMS OTP for production.
          </div>
          <Field label="New Admin PIN (4–6 digits)">
            <Input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Enter new PIN" />
          </Field>
          <Btn variant="prim" onClick={() => {
            if (newPin.length >= 4) { setS(p => ({ ...p, adminPin: newPin })); alert('PIN updated!'); setNewPin('') }
            else alert('PIN must be 4+ digits')
          }}>Update PIN</Btn>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 14 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={save}>Save settings</Btn>
      </div>
    </Modal>
  )
}
