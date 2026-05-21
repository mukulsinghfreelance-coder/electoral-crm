// ─── OTPModal.jsx ─────────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

export function OTPModal({ open, onClose, onSuccess, pin }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  const verify = () => {
    if (val === pin) { setVal(''); setErr(''); onSuccess() }
    else setErr('Incorrect PIN. Try again.')
  }
  return (
    <Modal open={open} onClose={() => { setVal(''); setErr(''); onClose() }} title="🔐 Admin PIN Required">
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Enter admin PIN to continue.</p>
      <Field label="PIN" error={err}>
        <Input type="password" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} autoFocus />
      </Field>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Btn onClick={() => { setVal(''); setErr(''); onClose() }}>Cancel</Btn>
        <Btn variant="prim" onClick={verify}>Verify</Btn>
      </div>
    </Modal>
  )
}

// ─── ConstantsModal.jsx ───────────────────────────────────────────────────────
export function ConstantsModal({ open, onClose, settings, onSave }) {
  const [f, setF] = React.useState({})
  React.useEffect(() => {
    if (open) setF({ state: settings.state, ls: settings.ls, vs: settings.vs, totalVoters: settings.totalVoters || '', totalBooths: settings.totalBooths || '' })
  }, [open])
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const setNum = k => e => setF(p => ({ ...p, [k]: e.target.value.replace(/\D/g, '') }))
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Constants">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
        <Field label="State">        <Input value={f.state        || ''} onChange={set('state')}                  placeholder="e.g. Bihar" /></Field>
        <Field label="Lok Sabha">    <Input value={f.ls           || ''} onChange={set('ls')}                     placeholder="e.g. Patna Sahib" /></Field>
        <Field label="Vidhan Sabha"> <Input value={f.vs           || ''} onChange={set('vs')}                     placeholder="e.g. Bankipur" /></Field>
        <Field label="Total Voters"> <Input value={f.totalVoters  || ''} onChange={setNum('totalVoters')}          placeholder="e.g. 250000" /></Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Total Booths"><Input value={f.totalBooths || ''} onChange={setNum('totalBooths')}          placeholder="e.g. 350" /></Field>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={() => { onSave(f); onClose() }}>Save</Btn>
      </div>
    </Modal>
  )
}

// ─── ImportModal.jsx ──────────────────────────────────────────────────────────
export function ImportModal({ open, onClose, onImport }) {
  const fileRef = React.useRef()
  return (
    <Modal open={open} onClose={onClose} title="⬆️ Import Contacts (Admin)">
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 9 }}>
        Columns: Name, Phone, WhatsApp, Mandal, Panchayat, Village, BoothNo, BoothName, Tag, Caste, Notes
      </p>
      <Field label="Paste CSV text">
        <textarea
          id="csv-paste"
          style={{ width: '100%', padding: '5px 8px', fontSize: 11, fontFamily: 'monospace', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', minHeight: 80, resize: 'vertical' }}
          placeholder="Name,Phone,WhatsApp,Mandal,Panchayat,Village,BoothNo,BoothName,Tag,Caste,Notes"
        />
      </Field>
      <div style={{ marginBottom: 9 }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={e => {
            const f = e.target.files[0]
            if (!f) return
            const r = new FileReader()
            r.onload = ev => document.getElementById('csv-paste').value = ev.target.result
            r.readAsText(f)
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={() => onImport(document.getElementById('csv-paste').value)}>Import</Btn>
      </div>
    </Modal>
  )
}

// ─── SheetsModal.jsx ──────────────────────────────────────────────────────────
export function SheetsModal({ open, onClose, settings, setSettings }) {
  const [url, setUrl] = React.useState(settings.sheetsUrl || '')
  React.useEffect(() => { if (open) setUrl(settings.sheetsUrl || '') }, [open])
  const copyCode = () => navigator.clipboard.writeText(APPS_SCRIPT).then(() => alert('Apps Script code copied!'))
  return (
    <Modal open={open} onClose={onClose} title="🔗 Google Sheets Integration" wide>
      <div style={{ background: '#E6F1FB', borderRadius: 6, padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#0C447C', lineHeight: 1.7 }}>
        <b>One-time setup (~5 min):</b><br />
        1. Open Google Sheets → create sheet named <b>Contacts</b><br />
        2. Extensions → Apps Script → paste code → Deploy → New deployment → Web App<br />
        3. Execute as: <b>Me</b> | Access: <b>Anyone</b> → Deploy → copy URL<br />
        4. Paste the URL below and save.
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Apps Script code</span>
          <Btn onClick={copyCode}>📋 Copy</Btn>
        </div>
        <pre style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '8px 10px', fontSize: 9, overflowX: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
          {APPS_SCRIPT}
        </pre>
      </div>
      <Field label="Deployed Web App URL">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
      </Field>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={() => { setSettings(s => ({ ...s, sheetsUrl: url })); onClose() }}>Save</Btn>
      </div>
    </Modal>
  )
}

// ─── SettingsModal.jsx ────────────────────────────────────────────────────────
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