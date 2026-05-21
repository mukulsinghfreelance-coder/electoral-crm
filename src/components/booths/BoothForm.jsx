import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Btn } from '../ui/Btn'

export default function BoothForm({ open, onClose, initial, settings, onSave }) {
  const mkBlank = () => ({
    bno: '', bnm: '', mandal: '', panchayat: '', voters: '', rating: '',
    castes: ['', '', ''],
    elec: [
      { cast: '', votes: ['', '', ''] },
      { cast: '', votes: ['', '', ''] },
      { cast: '', votes: ['', '', ''] },
    ],
    notes: '',
  })

  const [f, setF] = useState(mkBlank())
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (open) {
      if (initial) {
        setF({
          ...initial,
          castes: [...initial.castes],
          elec: initial.elec.map(e => ({ cast: String(e.cast || ''), votes: e.votes.map(String) })),
        })
      } else {
        setF(mkBlank())
      }
      setErrs({})
    }
  }, [open])

  const panchs = settings.mandals.find(m => m.name === f.mandal)?.panchayats || []

  const validate = () => {
    const e = {}
    if (!f.bno || !/^\d+$/.test(f.bno)) e.bno    = 'Numeric required'
    if (!f.mandal)                        e.mandal = 'Required'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const setElec = (ei, k, v, vi) => {
    const elec = [...f.elec]
    const e = { ...elec[ei] }
    if (k === 'cast') {
      e.cast = v.replace(/\D/g, '')
    } else {
      const vs = [...e.votes]
      vs[vi] = v.replace(/\D/g, '')
      e.votes = vs
    }
    elec[ei] = e
    setF(p => ({ ...p, elec }))
  }

  const setCaste = (i, v) => {
    const c = [...f.castes]; c[i] = v; setF(p => ({ ...p, castes: c }))
  }

  const submit = () => {
    if (!validate()) return
    onSave({
      ...f,
      voters: parseInt(f.voters) || 0,
      elec: f.elec.map(e => ({
        cast: parseInt(e.cast) || 0,
        votes: e.votes.map(v => parseInt(v) || 0),
      })),
    })
  }

  const thS = { padding: '4px 6px', textAlign: 'left', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? '✏️ Edit booth' : '📍 Add booth'} wide>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
        <Field label="Booth No." required error={errs.bno}>
          <Input value={f.bno} onChange={e => setF(p => ({ ...p, bno: e.target.value.replace(/\D/g, '') }))} error={errs.bno} placeholder="numeric" />
        </Field>
        <Field label="Booth Name">
          <Input value={f.bnm} onChange={e => setF(p => ({ ...p, bnm: e.target.value }))} placeholder="optional" />
        </Field>
        <Field label="Booth Rating">
          <Select value={f.rating} onChange={e => setF(p => ({ ...p, rating: e.target.value }))}>
            <option value="">— Optional —</option>
            <option value="A">A — Generally wins</option>
            <option value="B">B — Mediocre</option>
            <option value="C">C — Generally loses</option>
          </Select>
        </Field>
        <Field label="Mandal" required error={errs.mandal}>
          <Select value={f.mandal} onChange={e => setF(p => ({ ...p, mandal: e.target.value, panchayat: '' }))} error={errs.mandal}>
            <option value="">— Select —</option>
            {settings.mandals.map(m => <option key={m.name}>{m.name}</option>)}
          </Select>
        </Field>
        <Field label="Panchayat">
          <Select value={f.panchayat} onChange={e => setF(p => ({ ...p, panchayat: e.target.value }))} disabled={!f.mandal}>
            <option value="">— Select —</option>
            {panchs.map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Total Voters">
          <Input value={f.voters} onChange={e => setF(p => ({ ...p, voters: e.target.value.replace(/\D/g, '') }))} placeholder="e.g. 1200" />
        </Field>
      </div>

      {/* Top castes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
        {[0, 1, 2].map(i => (
          <Field key={i} label={`Top Caste ${i + 1}`}>
            <Select value={f.castes[i]} onChange={e => setCaste(i, e.target.value)}>
              <option value="">— Select —</option>
              {settings.castes.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        ))}
      </div>

      {/* Election history */}
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', paddingBottom: 4, marginBottom: 9 }}>
        Election history
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 10 }}>
        <thead>
          <tr>
            <th style={thS}>Election</th>
            <th style={thS}>Casted Vote</th>
            {settings.parties.map((p, i) => <th key={i} style={thS}>{p}</th>)}
            <th style={thS}>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {f.elec.map((e, ei) => {
            const total = e.votes.slice(0, settings.parties.length).reduce((a, v) => a + (parseInt(v) || 0), 0)
            const rem = (parseInt(e.cast) || 0) - total
            return (
              <tr key={ei} style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '4px 6px', color: 'var(--color-text-secondary)' }}>
                  {settings.elections[ei] || `E${ei + 1}`}
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <Input value={e.cast} onChange={ev => setElec(ei, 'cast', ev.target.value)} style={{ fontSize: 11, padding: '3px 5px' }} />
                </td>
                {settings.parties.map((_, pi) => (
                  <td key={pi} style={{ padding: '4px 6px' }}>
                    <Input value={e.votes[pi] || ''} onChange={ev => setElec(ei, 'vote', ev.target.value, pi)} style={{ fontSize: 11, padding: '3px 5px' }} />
                  </td>
                ))}
                <td style={{ padding: '4px 6px', fontWeight: 500, color: rem < 0 ? '#A32D2D' : 'var(--color-text-secondary)' }}>
                  {rem >= 0 ? rem : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Field label="Notes">
        <textarea
          value={f.notes}
          onChange={e => setF(p => ({ ...p, notes: e.target.value }))}
          placeholder="Booth notes…"
          style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', resize: 'vertical', minHeight: 44 }}
        />
      </Field>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={submit}>Save booth</Btn>
      </div>
    </Modal>
  )
}
