// ─── ConstantsModal.jsx ───────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

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

