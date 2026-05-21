import React, { useState, useEffect } from 'react'
import { TAGS } from '../../constants/data'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Btn } from '../ui/Btn'

export default function ContactForm({ open, onClose, initial, settings, onSave, syncToSheets }) {
  const blank = { name: '', phone: '', wa: '', mandal: '', panchayat: '', village: '', bno: '', bnm: '', tag: '', caste: '', notes: '' }
  const [f, setF] = useState(blank)
  const [errs, setErrs] = useState({})
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { if (open) { setF(initial || blank); setErrs({}) } }, [open])

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const panchs = settings.mandals.find(m => m.name === f.mandal)?.panchayats || []

  const validate = () => {
    const e = {}
    if (!f.name.trim())                          e.name      = 'Required'
    if (!f.phone.trim())                         e.phone     = 'Required'
    else if (!/^\d{10}$/.test(f.phone.trim()))   e.phone     = 'Must be 10 digits'
    if (f.wa && !/^\d{10}$/.test(f.wa.trim()))   e.wa        = 'Must be 10 digits'
    if (!f.mandal)                               e.mandal    = 'Required'
    if (!f.panchayat)                            e.panchayat = 'Required'
    if (!f.tag)                                  e.tag       = 'Required'
    if (!f.caste)                                e.caste     = 'Required'
    if (f.bno && !/^\d+$/.test(f.bno))           e.bno       = 'Numeric only'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    if (settings.sheetsUrl && !initial) {
      setSyncing(true)
      try { await syncToSheets(f) } catch (_) {}
      setSyncing(false)
    }
    onSave(f)
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? '✏️ Edit contact' : '➕ Add contact'}>
      {settings.sheetsUrl && !initial && (
        <div style={{ background: '#E6F1FB', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: 10, color: '#0C447C' }}>
          ✅ This contact will also sync to Google Sheets
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Full name" required error={errs.name}>
            <Input value={f.name} onChange={set('name')} error={errs.name} placeholder="e.g. Ramesh Kumar" />
          </Field>
        </div>

        <Field label="Phone" required error={errs.phone}>
          <Input value={f.phone} onChange={set('phone')} maxLength={10} error={errs.phone} placeholder="10-digit" />
        </Field>
        <Field label="WhatsApp" error={errs.wa}>
          <Input value={f.wa} onChange={set('wa')} maxLength={10} error={errs.wa} placeholder="optional" />
        </Field>

        <Field label="Mandal" required error={errs.mandal}>
          <Select value={f.mandal} onChange={e => setF(p => ({ ...p, mandal: e.target.value, panchayat: '' }))} error={errs.mandal}>
            <option value="">— Select —</option>
            {settings.mandals.map(m => <option key={m.name}>{m.name}</option>)}
          </Select>
        </Field>
        <Field label="Panchayat" required error={errs.panchayat}>
          <Select value={f.panchayat} onChange={set('panchayat')} error={errs.panchayat} disabled={!f.mandal}>
            <option value="">— Select —</option>
            {panchs.map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>

        <Field label="Village">
          <Input value={f.village} onChange={set('village')} placeholder="optional" />
        </Field>
        <Field label="Caste" required error={errs.caste}>
          <Select value={f.caste} onChange={set('caste')} error={errs.caste}>
            <option value="">— Select —</option>
            {settings.castes.map(c => <option key={c}>{c}</option>)}
          </Select>
        </Field>

        <Field label="Booth No." error={errs.bno}>
          <Input value={f.bno} onChange={e => setF(p => ({ ...p, bno: e.target.value.replace(/\D/g, '') }))} placeholder="numeric" error={errs.bno} />
        </Field>
        <Field label="Booth Name">
          <Input value={f.bnm} onChange={set('bnm')} placeholder="optional" />
        </Field>

        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Tag" required error={errs.tag}>
            <Select value={f.tag} onChange={set('tag')} error={errs.tag}>
              <option value="">— Select —</option>
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Notes">
            <textarea
              value={f.notes} onChange={set('notes')} placeholder="Notes…"
              style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', resize: 'vertical', minHeight: 44 }}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={submit} disabled={syncing}>{syncing ? 'Syncing…' : 'Save contact'}</Btn>
      </div>
    </Modal>
  )
}
